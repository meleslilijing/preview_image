# 运行步骤

1. 把整个文件夹放入go的项目路径。也就是`$GOPATH/src`. 如
> echo $GOPATH
/Users/username/work/go
> pwd
/Users/username/work/go/src/preview_image

## 自动运行

1. 在项目的根目录下执行 ./run.sh

## 手动运行

过程如下：
> server
1. 进入 server 目录。接着安装依赖。 
2. 运行 `go run .`

> client
1. 进入 client 目录。接着安装依赖.
2. 运行


```
进入一个terminal进程
cd server
go mod download
go mod tidy -v
go run .

另外启动一个terminal进程
cd client
npm i
npm run start
```
