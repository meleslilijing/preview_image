import {
  Text,
  Flex,
  Switch,
  Box,
  Button,
  Card,
  Container,
} from "@radix-ui/themes";
import "./App.css";
import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 850;
const CANVAS_HEIGHT = 600;
const MASK_STYLE_COLOR = "rgba(0,0,255,0.1)";

function App() {
  const imgPrevRef = useRef(null);
  const imgRef = useRef(new Image());

  const maskRef = useRef(null);

  // const [file, setFile] = useState(null);
  const [retireId, setRetireId] = useState("");
  const [showMask, setShowMask] = useState(true);
  const [id, setId] = useState("");

  const [mask, setMask] = useState({
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
  });
  // const [tempMask, setTempMask] = useState({
  //   dx: 0,
  //   dy: 0,
  //   dw: 0,
  //   dh: 0
  // })
  const tempMask = useRef({
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
  });

  const fileReader = useRef(new FileReader());

  useEffect(() => {
    // 操作mouse move选区
    if (!showMask) {
      return;
    }
    const maskDOM = maskRef.current;
    let isDown = false;

    const handleMouseDown = function (evt) {
      isDown = true;
      const { offsetX, offsetY } = evt;

      tempMask.current.dx = offsetX;
      tempMask.current.dy = offsetY;

      // setTempMask(rect => ({
      //   ...rect,
      //   dx: offsetX,
      //   dy: offsetY
      // }))
    };
    const handleMouseUp = function (evt) {
      isDown = false;
      if (!showMask) {
        return;
      }
      const { offsetX, offsetY } = evt;

      const { dx, dy } = tempMask.current;
      const dw = offsetX - dx;
      const dh = offsetY - dy;

      setMask({
        dx,
        dy,
        dw,
        dh,
      });

      tempMask.current = {
        dx: 0,
        dy: 0,
        dh: 0,
        dw: 0,
      };

      // setTempMask(rect => {
      //   let {dx, dy} = rect
      //   let dw = offsetX - dx
      //   let dh = offsetY - dy

      //   const nrect = {
      //     dx,
      //     dy,
      //     dw,
      //     dh
      //   }

      //   if (showMask && !!dw && !!dh) {
      //     setMask({...nrect}) // 渲染
      //   }

      //   return nrect
      // });
    };

    const handleMouseMove = function (evt) {
      if (!isDown || !showMask) {
        return;
      }
      const maskCtx = maskDOM.getContext("2d");
      const { offsetX, offsetY } = evt;

      const { dx, dy } = tempMask.current;

      const dw = offsetX - dx;
      const dh = offsetY - dy;

      maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      maskCtx.fillStyle = MASK_STYLE_COLOR;
      maskCtx.fillRect(dx, dy, dw, dh);
    };

    maskDOM.addEventListener("mousedown", handleMouseDown);
    maskDOM.addEventListener("mouseup", handleMouseUp);
    maskDOM.addEventListener("mousemove", handleMouseMove);
    return () => {
      maskDOM.removeEventListener("mousedown", handleMouseDown);
      maskDOM.removeEventListener("mouseup", handleMouseUp);
      maskDOM.addEventListener("mousemove", handleMouseMove);
    };
  }, [showMask]);

  useEffect(() => {
    // 操作mask绘制
    const maskDOM = maskRef.current;

    const maskCtx = maskDOM.getContext("2d");
    maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (showMask) {
      // draw mask
      const { dx, dy, dw, dh } = mask;
      maskCtx.fillStyle = MASK_STYLE_COLOR;
      maskCtx.fillRect(dx, dy, dw, dh);
    }
  }, [mask, showMask]);

  useEffect(() => {
    const reader = fileReader.current;
    const img = imgRef.current;

    const handleReaderOnload = function () {
      const readerSrc = this.result;
      img.src = readerSrc; // readerSrc is base64
    };

    const handleImgOnload = function () {
      // draw image
      if (!imgPrevRef.current) {
        return;
      }
      if (!img.src) {
        return;
      }

      const imgCtx = imgPrevRef.current.getContext("2d");
      const maskCtx = maskRef.current.getContext("2d");

      const imgWidth = img.width;
      const imgHeight = img.height;

      const [dx, dy, dw, dh] = aspectFit(
        imgWidth,
        imgHeight,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // clear canvas, then draw image. Because only one image can be previewed.
      imgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      imgCtx.drawImage(img, dx, dy, dw, dh);
    };

    reader.addEventListener("load", handleReaderOnload);
    img.addEventListener("load", handleImgOnload);
    return () => {
      reader.removeEventListener("load", handleReaderOnload);
      img.removeEventListener("load", handleImgOnload);
    };
  }, []);

  const saveDb = async () => {
    const imgbase64 = imgRef.current.src;
    if (imgbase64 === "") {
      alert("Please select Images, before Save setting in db.");
      return;
    }

    const data = {
      ...mask,
      imgbase64,
      // showMask: showMask
    };
    const url = "http://localhost:8080/save_mask";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      console.log(json);

      const { code, message } = json;
      if (code !== 0) {
        alert(message);
        return;
      }
      setId(json.data.id);
    } catch (error) {
      console.error(error);
    }
  };

  const retireFromDb = async () => {
    if (isNaN(+retireId)) {
      alert(`retireId only support number.`);
      return;
    }
    const url = `http://localhost:8080/retire_mask/${retireId}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    const { code, message } = json;
    if (code !== 0) {
      alert(message);
      return;
    }

    const { imgbase64, dx, dy, dw, dh } = json.data;
    console.log(json);

    imgRef.current.src = imgbase64;
    setMask({
      dx,
      dy,
      dh,
      dw,
    });

    setShowMask(() => true);
  };

  return (
    <div className="App">
      <Box
        style={{
          background: "var(--gray-a2)",
          borderRadius: "var(--radius-3)",
        }}
      >
        <Container size="3">
          <Card variant="classic">
            <div className="line">
              <label htmlFor="fileInput">Please select image file: </label>
              <input
                accept="image/*"
                id="fileInput"
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) {
                    return;
                  }
                  fileReader.current.readAsDataURL(file); //转化成base64数据类型
                  // setFile();
                }}
              />
            </div>
            <div className="line">
              <Text as="label" size="2">
                <Flex gap="2">
                  <Switch
                    defaultChecked={showMask}
                    onClick={(e) => {
                      setShowMask(!!e.target.value);
                    }}
                  />{" "}
                  显示 Mask
                </Flex>
              </Text>
            </div>
            <div className="line">
              <Flex justify="between">
                <Flex gap="2">
                  <Button id="save-db-btn" type="button" onClick={saveDb}>
                    Save to Database
                  </Button>
                  <Text>ID: {id}</Text>
                </Flex>
                <Flex gap="2">
                  <label htmlFor="retire-input">ID: </label>
                  <input
                    id="retire-input"
                    type="text"
                    onChange={(e) => setRetireId(e.target.value)}
                    value={retireId}
                  />
                  <Button type="button" onClick={retireFromDb}>
                    Retire
                  </Button>
                </Flex>
              </Flex>
            </div>
            <div className="line">
              <Button
                className="clear"
                onClick={() => {
                  const maskCtx = maskRef.current.getContext("2d");
                  const imgCtx = imgPrevRef.current.getContext("2d");

                  maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                  imgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                }}
              >
                Clear Canvas
              </Button>
            </div>
            <div
              className="preview-canvas line"
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
              }}
            >
              <canvas
                ref={imgPrevRef}
                key="img-canvas"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="preview-layer image-layer"
              ></canvas>
              <canvas
                ref={maskRef}
                key="mask-canvas"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="preview-layer mask-layer"
              ></canvas>
            </div>
          </Card>
        </Container>
      </Box>
    </div>
  );
}

export default App;

const aspectFit = (imageWidth, imageHeight, canvasWidth, canvasHeight) => {
  const imageRate = imageWidth / imageHeight;
  const canvasRate = canvasWidth / canvasHeight;
  let [dx, dy, dw, dh] = [];
  if (imageRate >= canvasRate) {
    dw = canvasWidth;
    dh = canvasWidth / imageRate;
  } else {
    dh = canvasHeight;
    dw = canvasHeight * imageRate;
  }
  dx = (canvasWidth - dw) / 2;
  dy = (canvasHeight - dh) / 2;
  return [dx, dy, dw, dh];
};
