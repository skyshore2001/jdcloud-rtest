# 筋斗云后端接口测试框架

## 使用

将待测工程设置为支持回归测试：基于jdcloud(php版)的工程，应在server/plugin/index.php中设置

	Plugins::add("rtest");

然后在rtest.html中修改g_cfg.url对应筋斗云后端服务基础地址，然后在浏览器中打开该文件即可测试。

注意：从本地文件访问服务，涉及跨域调用，而框架后台已默认允许跨域调用。

在使用chrome 80版本以上浏览器进行测试时，可能会因cookie的SameSite策略导致跨站点时无法携带cookie, 进而发生登录后仍无效。

在chrome 80版本后，可禁用SameSite策略：

	谷歌浏览器地址栏输入：chrome://flags/
	找到：SameSite by default cookies、Cookies without SameSite must be secure
	设置上面这两项设置成 Disable

若后台服务未开放跨域调用（以前的jdcloud工程中仅有测试模式下服务器才自动允许跨域），可设置chrome浏览器的启动模式以允许跨域，即添加命令行启动参数：

	--args --disable-web-security --user-data-dir --allow-file-access-from-files

### 测试jdcloud-java项目

在jdcloud-java项目下修改svc/WEB-INF/web.properties中设置

	JDEnv=com.demo.rtest.WebApi

在本项目rtest.html中修改URL:

	var g_cfg = {
		url: "http://localhost:8080/svc/api" // jdcloud-java
	}

### 说明

- DESIGN.md是测试用例相关的接口设计。
- rtest.js是所有的测试用例定义。

特性：

- 如果第一个用例或标记为critical的用例失败，整个suite失败，其它用例直接忽略。
- 如果第一个suite失败，则测试中止，忽略其它测试。
- 运行过程中，可以手工点击"Stop"按钮停止测试。

## 开发测试用例

核心使用jasmine库，是一个以BDD(行为驱动开发)为理念的测试框架。

Jasmine is a behavior-driven development framework for testing JavaScript code. 

这里用到的jasmine是在版本2.5.2基础上增加了一些修改(lib/jasmine-2.5.2)，以更好地支持对后端Web接口的测试。
查看这些修改可在jasmine源码中搜索LJ标识。

lib/tool.js是对筋斗云后端的通用支持，定义了常用的 callSvr/callSvrSync函数，toJDTable/toJDList/toJDObj断言等。

## 参考

- jasmine首页：https://jasmine.github.io/
- jasmine文档：https://jasmine.github.io/2.5/introduction
