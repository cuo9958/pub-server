## 分布式APP热更新包发布服务

后台服务发布数据通知到其他所有接口，同步更新最新的配置。

> pub-service 插件是内部插件，可以搜索同级github目录下的 pub-service库

### 部署过程

1. 克隆pub-service项目，修改配置文件的数据库为自己的地址，然后发布到私有库上。
2. 克隆pub-server项目，修改服务的引用地址和版本号。
3. 发布到服务器上，`npm install`安装所有的包。
4. 使用`npm run start`启动进程查看，或者使用pm2启动`pm2.json`文件。
5. 配置方向代理，将接口地址`/papi`指向web项目的域名。
6. 部署后台即为完成。
7. 将`/capi`接口代理到需要的地址，app可以访问这个`/capi/check`地址请求最新的bundle文件下载地址。

check接口返回的样子
```
{
    status:0,//0代表成功
    errmsg:"",//失败的时候会有失败信息
    data:{
        sign:"",//文件的md5值
        downloadUrl:"",//后台配置的文件下载地址
        bundleCompressUrl:""//压缩包地址
    },
    timeline:0//接口执行的时间
}
```