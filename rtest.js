// doc: https://jasmine.github.io/2.5/introduction

/**
准备：

User表中添加数据：

insert into User (uname, pwd, name) values ('rtest', '1234', 'jdcloud-test')
 */
// tools

// ctx={uname, pwd, uid?}
var loginCtx = {uname: "rtest", pwd: "1234"};

function userLogin()
{
	var ctx = loginCtx;
	if (ctx.uid != null)
		return;
	var ret = callSvrSync("login", {uname: ctx.uname, pwd: ctx.pwd});
	expect(ret).toEqual({id: jasmine.any(Number)});
	ctx.uid = ret.id;
}

function userLogout()
{
	var ret = callSvrSync("logout");
	//expect(ret).toEqual("OK");
	loginCtx.uid = null;
}

describe("工具函数", function() {

describe("param函数", function() {

	it("整型参数", function () {
		var ret = callSvrSync("fn", {f: "param", name: "id", id: 99});
		expect(ret).toEqual(99);

		ret = callSvrSync("fn", {f: "param", name: "id", id: '9a'});
		expect(ret).toJDRet(E_PARAM);
	});

	it("字符串型参数", function () {
		var str = "jason smith";
		var ret = callSvrSync("fn", {f: "param", name: "str", coll: "P"}, $.noop, {str: str});
		expect(ret).toEqual(str);
	});

	it("字符串型参数-防止XSS攻击", function () {
		var str = "a&b";
		var str2 = "a&amp;b";
		var ret = callSvrSync("fn", {f: "param", name: "str", coll: "P"}, $.noop, {str: str});
		expect(ret).toEqual(str2);
	});

	it("数值型参数", function () {
		var ret = callSvrSync("fn", {f: "param", name: "amount/n", coll: 'P'}, $.noop, {amount: 99.9});
		expect(ret).toEqual(99.9);

		ret = callSvrSync("fn", {f: "param", name: "amount/n", amount: '9a'});
		expect(ret).toJDRet(E_PARAM);
	});

	it("布尔型参数", function () {
		var ret = callSvrSync("fn", {f: "param", name: "wantArray/b", wantArray: 1});
		expect(ret).toEqual(true);

		var ret = callSvrSync("fn", {f: "param", name: "wantArray/b", wantArray: '1a'});
		expect(ret).toJDRet(E_PARAM);
	});
	it("日期型参数", function () {
		var dt = new Date();
		dt.setMilliseconds(0);

		var ret = callSvrSync("fn", {f: "param", name: "testTm/tm", testTm: dt.toISOString()});
		// 服务端返回日期格式为 '1488124800'(php) 或 '2018-05-05 00:00:00'(java) 或 '/Date(1488124800000)/'(C#)
		ret = parseDate(ret);
		expect(ret).toEqual(dt);

		var ret = callSvrSync("fn", {f: "param", name: "testDt/dt", testDt: dt.toISOString()});
		ret = parseDate(ret);
		dt.setHours(0);
		dt.setMinutes(0);
		dt.setSeconds(0);
		expect(ret).toEqual(dt);

		var ret = callSvrSync("fn", {f: "param", name: "testDt/dt", testDt: 'bad-datetime'});
		expect(ret).toJDRet(E_PARAM);
	});

	it("i+类型", function () {
		var ret = callSvrSync("fn", {f: "param", name: "idList/i+", idList: "3,4,5"});
		expect(ret).toEqual([3,4,5]);

		var ret = callSvrSync("fn", {f: "param", name: "idList/i+", idList: '3;4;5'});
		expect(ret).toJDRet(E_PARAM);
	});
	it("压缩表类型-varr", function () {
		var ret = callSvrSync("fn", {f: "param", name: "items/i:n:s:b:dt", items: "100:1:洗车:1:2016-10-11,101:1:打蜡:0:2017-10-11"});
		expect(ret).toEqual([ [100, 1.0, "洗车", true, daca.anyDate("2016-10-11")], [101, 1, "打蜡", false, daca.anyDate("2017-10-11")]]);

		var ret = callSvrSync("fn", {f: "param", name: "items/i:n?:s?", items: "100:1,101::打蜡"});
		expect(ret).toEqual([ [100, 1.0, null], [101, null, "打蜡"]]);

		var ret = callSvrSync("fn", {f: "param", name: "items/i:n:s", items: '100:1,101:2'});
		expect(ret).toJDRet(E_PARAM);
	});

	it("mparam", function () {
		var ret = callSvrSync("fn", {f: "mparam", name: "id", id: 99});
		expect(ret).toEqual(99);

		ret = callSvrSync("fn", {f: "mparam", name: "id", id: 99, coll: "P"});
		expect(ret).toJDRet(E_PARAM);
	});
	it("支持POST内容以json格式传递", function () {
		var userObj = {id: 99, name: "jerry", perms: ["emp","mgr"]};
		var ret = callSvrSync("fn", {f: "param", name: "perms"}, $.noop, {_json: userObj});
		expect(ret).toEqual(userObj.perms);

		var ret = callSvrSync("fn", {f: "param", name: "user"}, $.noop, {_json: {user:userObj} });
		expect(ret).toEqual(userObj);
	});
});

describe("数据库函数", function() {
	var rowCtx_ = {
		tm: new Date(),
		addr: "test-addr",
		id: null,
	};
	rowCtx_.tm.setMilliseconds(0);  // 注意：mysql数据库不能存储毫秒

	function genId()
	{
		if (rowCtx_.id != null)
			return;

		var tmstr = formatDate(rowCtx_.tm);
		var ret = callSvrSync("fn", {f: "execOne", sql: "INSERT INTO ApiLog (tm, addr) VALUES ('" + tmstr + "', '" + rowCtx_.addr + "')", getNewId: true});
		expect(ret).toEqual(jasmine.any(Number));
		rowCtx_.id = ret;
	}

	it("execOne", function () {
		genId();
	});

	it("queryAll", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryAll", sql: "SELECT id,tm,addr FROM ApiLog WHERE id=" + rowCtx_.id, assoc: true});
		expect(ret).toEqual(jasmine.any(Array));
		expect(ret[0]).toEqual({id: rowCtx_.id, tm: daca.anyDate(rowCtx_.tm), addr: rowCtx_.addr});
	});
	it("queryAll-empty", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryAll", sql: "SELECT id,tm,addr FROM ApiLog WHERE id=-1", assoc: true});
		expect(ret).toEqual([]);
	});

	it("queryOne", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryOne", sql: "SELECT id,tm,addr FROM ApiLog WHERE id=" + rowCtx_.id, assoc: true});
		expect(ret).toEqual({id: rowCtx_.id, tm: daca.anyDate(rowCtx_.tm), addr: rowCtx_.addr});
	});
	it("queryOne-array", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryOne", sql: "SELECT id,tm,addr FROM ApiLog WHERE id=" + rowCtx_.id});
		expect($.isArray(ret) && ret.length == 3).toEqual(true);
		expect(ret).toEqual([rowCtx_.id, daca.anyDate(rowCtx_.tm), rowCtx_.addr]);
	});
	it("queryOne-empty", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryOne", sql: "SELECT id,tm,addr FROM ApiLog WHERE id=-1"});
		expect(ret).toEqual(false);
	});

	it("queryOne-scalar", function () {
		genId();
		var ret = callSvrSync("fn", {f: "queryOne", sql: "SELECT tm FROM ApiLog WHERE id=" + rowCtx_.id});
		expect(ret).toEqual(daca.anyDate(rowCtx_.tm));
	});

	it("执行错误", function () {
		var ret = callSvrSync("fn", {f: "queryOne", sql: "SELECT FROM ApiLog WHERE id=" + rowCtx_.id, assoc: true});
		expect(ret).toJDRet(E_DB);
	});
});

});

describe("登录及权限", function() {

	beforeAll(function() {
		userLogout();
	});

	it("不存在的接口", function () {
		var ret = callSvrSync("xxx_no_method");
		expect(ret).toJDRet(E_PARAM);
	});

	it("未登录时调用要求登录的接口", function () {
		var ret = callSvrSync("whoami");
		expect(ret).toJDRet(E_NOAUTH);
	});

	it("login", function () {
		userLogin();
	});

	it("whoami", function () {
		userLogin();
		var ret = callSvrSync("whoami");
		expect(ret).toEqual({id: loginCtx.uid});
	});
});

describe("对象型接口", function() {
	var id_;
	var postParam_; // {ac, addr}

	beforeAll(function() {
		userLogout();
	});

	// withRes?=false, fields?=null
	// fields: 额外指定字段，如`{app:'aaa', ver:'web'}`
	function generalAdd(withRes, fields)
	{
		if (id_ != null && !withRes && fields == null)
			return;

		var rd = Math.random();
		postParam_ = {ac: "ApiLog.add", addr: "test-addr" + rd};
		if (fields)
			$.extend(postParam_, fields);
		var param = {};
		if (withRes) {
			param.res = "id,addr,tm";
		}
		var ret = callSvrSync("ApiLog.add", param, $.noop, postParam_);

		var id;
		if (!withRes) {
			expect(ret).toEqual(jasmine.any(Number));
			id = ret;
		}
		else {
			expect(ret).toEqual(jasmine.objectContaining({
				id: jasmine.any(Number),
				addr: postParam_.addr,
				tm: jasmine.any(String)
				//tm: jasmine.any(Date)
			}));
			// ac未在res中指定，不应包含
			expect(ret).not.toJDObj(["ac"]);
			id = ret.id;
		}
		if (fields == null)
			id_ = id;
		return id;
	}

	it("add操作", function () {
		generalAdd();
	});
	it("add操作-res", function () {
		generalAdd(true);
	});
	it("add操作-必填字段", function () {
		// ac为必填字段
		var ret = callSvrSync("ApiLog.add", $.noop, {addr: "my addr"});
		expect(ret).toJDRet(E_PARAM);
	});

	it("get操作", function () {
		generalAdd();
		var ret = callSvrSync("ApiLog.get", {id: id_});
		expect(ret).toJDObj(["id", "addr", "ac", "tm"], true);
		// ua是隐藏字段，不应返回
		expect(ret).not.toJDObj(["ua"]);
	});

	it("get操作-res", function () {
		generalAdd();
		var ret = callSvrSync("ApiLog.get", {id: id_, res: "id,addr,tm"});
		formatField(ret);
		expect(ret).toEqual({id: id_, addr: postParam_.addr, tm: jasmine.any(Date)});
	});
	it("set操作", function () {
		generalAdd();

		var newAddr = "new-addr";
		var ret = callSvrSync("ApiLog.set", {id: id_}, $.noop, {ac: "new-ac", addr: newAddr, tm: '2010-01-01'});
		expect(ret).toEqual("OK");

		var ret = callSvrSync("ApiLog.get", {id: id_, res: 'ac,addr,tm'});
		formatField(ret);
		// ac,tm是只读字段，设置无效。应该仍为当前日期
		expect(ret).toEqual({ac: postParam_.ac, addr: newAddr, tm: jasmine.any(Date)});
		expect(ret.tm.getFullYear()).toEqual(new Date().getFullYear());
	});

	it("query操作", function () {
		generalAdd();

		var pagesz = 3;
		var ret = callSvrSync("ApiLog.query", {pagesz: pagesz});
		expect(ret).toJDTable(["id", "ac", "addr", "tm"]);
		// 至少有一条
		expect(ret.d.length).toBeGreaterThan(0);
		if (ret.nextkey) {
			expect(ret.d.length).toEqual(pagesz);
		}
		else {
			expect(ret.d.length).toBeLessThanOrEqual(pagesz);
		}
		// 不包含"ua"属性
		expect(ret.h).not.toContain("ua");
	});
	it("query操作-res/cond", function () {
		generalAdd();

		var pagesz = 3;
		var ret = callSvrSync("ApiLog.query", {pagesz: pagesz, res: "id,ac", cond: "id=" + id_});
		expect(ret).toEqual({h: ["id", "ac"], d: jasmine.any(Array)});
		// 只有一条
		expect(ret.d.length).toEqual(1);
	});
	it("query操作-alias in res/gres", function () {
		generalAdd();

		// alias在res/gres,cond/gcond,orderby中的替换
		var pagesz = 3;
		var ret = callSvrSync("ApiLog.query", {
			pagesz: pagesz,
			res: "count(*) cnt",
			cond: "action is not null and id<1000",
			gres: "ac action",
			orderby: "cnt DESC",
			gcond: "cnt>1"
		});
		expect(ret).toJDTable(["action", "cnt"]);

		ret = callSvrSync("ApiLog.query", {
			pagesz: pagesz,
			res: "count(*) 总数",
			cond: "操作 is not null and id<1000",
			gres: "ac as 操作",
			orderby: "总数 DESC",
			gcond: "总数>1"
		});
		expect(ret).toJDTable(["操作", "总数"]);

		ret = callSvrSync("ApiLog.query", {
			pagesz: pagesz,
			res: "ac 操作, count(*) 总数, id \"金额(元)\", id \"速度 m/s\"",
			cond: "操作 is not null and id<1000"
		});
		expect(ret).toJDTable(["操作", "总数", "金额(元)", "速度 m/s"]);
	});
	it("query操作-分页", function () {
		// 按id排序，使用的是partial paging机制，nextkey为返回的最后一个id
		generalAdd();

		var pagesz = 3;
		var param = {pagesz: pagesz, res: "id,ac", cond: "id<=" + id_, orderby: "id DESC"};
		var ret = callSvrSync("ApiLog.query", param);
		expect(ret).toJDTable(["id", "ac"]);
		if (ret.nextkey) {
			// nextkey是最后一条记录的id
			expect(ret.nextkey).toEqual(ret.d[ret.d.length-1][0]);

			// 取第二页
			var ret2 = callSvrSync("ApiLog.query", $.extend({}, param, {pagekey:ret.nextkey}));
			expect(ret2).toJDTable(["id", "ac"]);
			// 下一页与前一页一定不同，因而首记录id不同。
			expect(ret2.d[0][0]).not.toEqual(ret.d[0][0]);
		}
		else {
			// 不满一页，没有下一页的情况
			expect(ret.d.length < pagesz).toEqual(true);
		}
	});
	it("query操作-orderby及分页", function () {
		// 与上面按id排序不同，这里按tm排序，无法使用partial paging机制，nextkey为传统页码。
		generalAdd();

		// 指定 pagekey=0时，应返回total字段。
		var pagesz = 3;
		var param = {pagesz: pagesz, res: "id,ac", cond: "id<=" + id_, orderby: "tm DESC"};
		var ret = callSvrSync("ApiLog.query", $.extend({}, param, {pagekey:0}));
		expect(ret).toJDTable(["id", "ac"]);
		expect(ret).toEqual(jasmine.objectContaining({h: ["id", "ac"], d: jasmine.any(Array), total: jasmine.any(Number)})); // 应有total字段

		var ret2;
		if (ret.nextkey) {
			// 取第二页, 由于不是按照id排序，不能使用parital paging机制，第二页就是nextkey=2
			expect(ret.nextkey).toEqual(2);
			ret2 = callSvrSync("ApiLog.query", $.extend({}, param, {pagekey:ret.nextkey}));
			expect(ret2).toJDTable(["id", "ac"]);
			expect(ret2).toJDObj(["!total"]); // 不含total字段
			// 下一页与前一页一定不同，因而首记录id不同。
			expect(ret2.d[0][0]).not.toEqual(ret.d[0][0]);
		}

		// 检查最后一页
		var pageCnt = Math.ceil(ret.total / pagesz);
		var lastPageSz = ret.total % pagesz;
		if (lastPageSz == 0)
			++ pageCnt;
		if (pageCnt == 1) {
			expect(ret.d.length).toEqual(pageCnt);
		}
		else {
			var retN;
			if (pageCnt == 2) {
				retN = ret2;
			}
			else {
				retN = callSvrSync("ApiLog.query", $.extend({}, param, {pagekey: pageCnt}));
				expect(retN).toJDTable(["id", "ac"]);
			}
			expect(retN.d.length).toEqual(lastPageSz);
			expect(retN).toJDObj(["!nextkey"]); // 最后一页没有nextkey字段
		}
	});
	it("query操作-page参数强制传统分页", function () {
		// 按id排序，默认使用的是partial paging机制，用page参数强制使用传统按页数来分页（LIMIT机制）
		generalAdd();

		var pagesz = 3;
		var param = {pagesz: pagesz, res: "id,ac", cond: "id<=" + id_, orderby: "id DESC", page: 1};
		var ret = callSvrSync("ApiLog.query", param);
		expect(ret).toJDTable(["id", "ac"]);
		expect(ret).toJDObj(["total"]); // 用page参数必返回total字段
		if (ret.nextkey) {
			// nextkey是页数
			expect(ret.nextkey).toEqual(2);

			// 取第二页
			var ret2 = callSvrSync("ApiLog.query", $.extend({}, param, {page: ret.nextkey}));
			expect(ret2).toJDTable(["id", "ac"]);
			expect(ret2).toJDObj(["total"]); // 用page参数必返回total字段
			// 下一页与前一页一定不同，因而首记录id不同。
			expect(ret2.d[0][0]).not.toEqual(ret.d[0][0]);
		}
		else {
			// 不满一页，没有下一页的情况
			expect(ret.d.length < pagesz).toEqual(true);
		}
	});
	it("query操作-gres统计", function () {
		//generalAdd();

		var pagesz = 3;
		var dt = new Date();
		dt.setTime(dt - T_DAY*7); // 7天内按ac分组统计
		// 设置了pagekey, 要求返回total字段
		var ret = callSvrSync("ApiLog.query", {gres:"ac", res:"count(*) cnt, sum(id) fakeSum", cond: "tm>='" + formatDate(dt) + "' and ac IS NOT NULL", orderby: "cnt desc", pagesz: pagesz, pagekey: 0});
		expect(ret).toJDTable(["ac", "cnt", "fakeSum"]);

		// 检查total计算是否正确, 注意：需要支持count(distinct ac)
		var ret2 = callSvrSync("ApiLog.query", {res:"count(distinct ac) cnt", cond: "tm>='" + formatDate(dt) + "' and ac IS NOT NULL" });
		expect(ret2).toJDTable(["cnt"]);
		expect(ret.total).toEqual(ret2.d[0][0]);

		// 测试gcond参数
		var maxCnt = ret.d[0][1]; // ["ac","cnt",...]
		var gcond = "cnt<" + maxCnt;
		ret3 = callSvrSync("ApiLog.query", {gres:"ac", res:"count(*) cnt", cond: "tm>='" + formatDate(dt) + "' and ac IS NOT NULL", orderby: "cnt desc", gcond: gcond, pagesz: pagesz});
		expect(ret3).toJDTable(["ac", "cnt"]);
		if (ret3.d.length > 0)
			expect(ret3.d[0][1]).toBeLessThan(maxCnt); // gcond过滤了cnt最大的那些
	});
	it("query操作-gres统计-中文", function () {
		var pagesz = 3;
		var dt = new Date();
		dt.setTime(dt - T_DAY*7); // 7天内按ac分组统计
		var ret = callSvrSync("ApiLog.query", {gres:"ac 动作", res:"count(*) 总数, sum(id) 总和", cond: "tm>='" + formatDate(dt) + "'", orderby: "总数 desc", pagesz: pagesz});
		expect(ret).toJDTable(["动作", "总数", "总和"]);

		var ret = callSvrSync("ApiLog.query", {gres:"ac \"动作\"", res:"count(*) \"总数\", sum(id) \"总和\"", cond: "tm>='" + formatDate(dt) + "'", orderby: "\"总数\" desc"});
		expect(ret).toJDTable(["动作", "总数", "总和"]);
	});
	it("query操作-list", function () {
		generalAdd();

		var pagesz = 3;
		var ret = callSvrSync("ApiLog.query", {pagesz: pagesz, fmt: "list"});
		expect(ret).toJDList(["id", "ac", "addr", "tm"]);
		// 至少有一条
		expect(ret.list.length).toBeGreaterThan(0);
		if (ret.nextkey) {
			expect(ret.list.length).toEqual(pagesz);
		}
		else {
			expect(ret.list.length).toBeLessThanOrEqual(pagesz);
		}
		// 不包含"ua"属性
		expect(ret.list[0].hasOwnProperty("ua")).toBeFalsy();
	});

	// 匹配行列，或字符串匹配tag
	function testExport(fmt, sp, tag)
	{
		var ret = callSvrSync("ApiLog.query", {pagesz: 3, fmt: fmt, res: "id,ac 接口名,addr 地址,tm \"日期 时间\""}, $.noop, null, {nofilter:1});
		if (tag) {
			expect(ret.substr(0, tag.length)).toEqual(tag);
			return;
		}
		var arr = ret.split("\n");
		expect(arr.length >= 2).toEqual(true); // 至少2行，标题和首行

		var cols = arr[0].split(sp);
		expect(cols.length).toEqual(4); // 标题列

		cols = arr[1].split(sp);
		expect(cols.length).toEqual(4); // 数据列
	}

	it("query操作-导出txt", function () {
		testExport("txt", "\t");
	});
	it("query操作-导出csv", function () {
		testExport("csv", ",");
	});
	it("query操作-导出excelcsv", function () {
		testExport("excelcsv", ",");
	});
	it("query操作-导出excel", function () {
		testExport("excel", null, "PK");
	});
	it("query操作-导出html", function () {
		testExport("html", null, "<table");
	});

	it("query操作-支持enum/enumList", function () {
		var id = generalAdd(false, {app:"mgr,boss", ver:"web"});

		// 支持字段加引号
		var ret = callSvrSync("ApiLog.query", {
			res: "id 编号, ver 版本=a:安卓;ios:苹果IOS;wx:微信;web:PC浏览器, app \"权限\"=emp:员工;mgr:经理;boss:老板",
			cond: "id=" + id,
		});
		expect(ret).toJDTable(["编号", "版本", "权限"]);
		expect(ret.d[0][1]).toEqual("PC浏览器");
		expect(ret.d[0][2]).toEqual("经理,老板");
	});

	// del操作放最后，删除临时添加的数据
	it("del操作", function () {
		generalAdd();

		var ret = callSvrSync("ApiLog.del", {id: id_});
		expect(ret).toEqual("OK");

		var ret = callSvrSync("ApiLog.get", {id: id_});
		expect(ret).toJDRet(E_PARAM);
	});
});

describe("对象型接口-异常", function() {
	beforeAll(function() {
		userLogout();
	});

	it("id不存在", function () {
		$.each(["get", "set", "del"], function () {
			var ret = callSvrSync("ApiLog." + this);
			expect(ret).toJDRet(E_PARAM);

			if (this != "set") {
				var ret = callSvrSync("ApiLog." + this, {id: -9});
				expect(ret).toJDRet(E_PARAM);
			}
		});
	});

	it("表不存在", function () {
		var ret = callSvrSync("ApiLog123.query");
		expect(ret).toJDRet(E_NOAUTH);
	});

	it("操作不存在", function () {
		var ret = callSvrSync("ApiLog.cancel");
		expect(ret).toJDRet(E_PARAM);
	});

	it("字段不存在", function () {
		var ret = callSvrSync("ApiLog.query", {res: "id,id123"});
		expect(ret).toJDRet(E_DB);
	});

	it("限制cond", function () {
		var ret = callSvrSync("ApiLog.query", {cond: "userId in (SELECT id FROM User)"});
		expect(ret).toJDRet(E_FORBIDDEN);
	});

	it("限制res", function () {
		var ret = callSvrSync("ApiLog.query", {res: "Max(id) maxId"});
		expect(ret).toJDRet(E_FORBIDDEN);
	});
});

describe("UserApiLog", function() {
	var id_;
	var postParam_; // {ac, addr}

	beforeAll(function() {
		userLogout();
	});

	function generalAdd()
	{
		if (id_ != null)
			return;

		var rd = Math.random();
		postParam_ = {ac: "UserApiLog.add", addr: "test-addr" + rd};
		var param = {};
		var ret = callSvrSync("UserApiLog.add", param, $.noop, postParam_);

		expect(ret).toEqual(jasmine.any(Number));
		id_ = ret;
	}

	it("UserApiLog.query-noauth", function () {
		var ret = callSvrSync("UserApiLog.query");
		expect(ret).toJDRet(E_NOAUTH);
	});
	it("UserApiLog.set-forbidden", function () {
		userLogin();
		var ret = callSvrSync("UserApiLog.set");
		expect(ret).toJDRet(E_FORBIDDEN);
	});

	it("UserApiLog.add", function () {
		userLogin();
		generalAdd();
	});
	it("UserApiLog.query", function () {
		userLogin();
		generalAdd();

		var ret = callSvrSync("UserApiLog.query", {pagesz:5, cond: "id<=" + id_});
		expect(ret).toJDTable(["id", "userName", "!last3LogAc", "!user", "!last3Log"]);
		var arr = rs2Array(ret);
		// 至少有一条
		expect(arr.length).toBeGreaterThan(0);
		expect(arr[0].id).toEqual(id_);
		expect(arr[0].userName != null).toEqual(true);
	});
	it("query-在cond条件中使用虚拟字段", function () {
		userLogin();
		generalAdd();

		var ret = callSvrSync("UserApiLog.query", {pagesz:5, cond: "userId IS NOT NULL AND userId<>0 AND userName LIKE '%test%'"});
		expect(ret).toJDTable(["id", "userName", "!last3LogAc", "!user", "!last3Log"]);
		var arr = rs2Array(ret);
		// 至少有一条
		expect(arr.length).toBeGreaterThan(0);
	});
	it("UserApiLog.query-vcol", function () {
		userLogin();
		generalAdd();

		var ret = callSvrSync("UserApiLog.query", {res: "id, last3LogAc", pagesz:5, cond: "id<=" + id_});
		expect(ret).toJDTable(["id", "!userName", "*last3LogAc", "!user", "!last3Log"]);
		var arr = rs2Array(ret);
		// 至少有一条
		expect(arr.length).toBeGreaterThan(0);
		expect(arr[0].id).toEqual(id_);

		// 子项1-3条之间
		var list = list2varr(arr[0].last3LogAc);
		var n = list.length;
		expect(n >= 0 && n <= 3).toEqual(true);
		// 每条有两列:id,ac
		expect(list[0].length == 2).toEqual(true);
	});
	it("UserApiLog.query-subobj", function () {
		userLogin();
		generalAdd();

		var ret = callSvrSync("UserApiLog.query", {res: "id, user, last3Log", pagesz:5, cond: "id<=" + id_});
		expect(ret).toJDTable(["id", "!userName", "!last3LogAc", "user", "last3Log"]);
		var arr = rs2Array(ret);
		// 至少有一条
		expect(arr.length).toBeGreaterThan(0);
		expect(arr[0].id).toEqual(id_);
		expect(arr[0].user).toEqual({
			id: loginCtx.uid, name: jasmine.any(String)
		});
		expect($.isArray(arr[0].last3Log) && arr[0].last3Log.length > 0).toEqual(true);
	});

	it("UserApiLog.listByAc-非标方法", function () {
		userLogin();
		generalAdd();

		var ret = callSvrSync("UserApiLog.listByAc", {ac: "UserApiLog.add", pagesz:1});
		expect(ret).toJDList(["id", "userName", "!last3LogAc", "!user", "!last3Log"]);
		var arr = ret.list;
		// 至少有一条, 由于设置了pagesz=1，刚好一条
		expect(arr.length == 1).toEqual(true);
		expect(arr[0].id).toEqual(id_);
		expect(arr[0].userName != null).toEqual(true);
	});
});

describe("Batch批处理", function() {
	function checkBatchRet(ret, expArr) {
		expect(ret.length).toEqual(expArr.length);
		$.each(expArr, function (i, exp) {
			$.each(exp, function (j, e) {
				expect(e).toEqual(ret[i][j]);
			});
		});
	}
	it("基本", function () {
		var ival = 99;
		var sval = "jason smith";
		var req = [
			{ac: "fn", get: {f:"param", name: "id", id: ival}},
			{ac: "fn", get: {f:"param", name: "str", coll: "P"}, post: {str: sval}}
		];
		var ret = callSvrSync("batch", $.noop, {_json: req});
		checkBatchRet(ret, [
			[0, ival],
			[0, sval]
		]);
	});
	it("部分失败及事务请求", function () {
		var ival = 99;
		var sval = "jason smith";
		var req = [
			{ac: "fn", get: {f: "execOne", sql: "INSERT INTO ApiLog (tm, addr) VALUES ('2017-1-1', 'test-addr')", getNewId: true}},
			{ac: "fn", get: {f:"mparam", name: "id", id2: ival}},
			{ac: "fn", get: {f:"param", name: "str", coll: "P"}, post: {str: sval}}
		];

		// 无事务
		var ret = callSvrSync("batch", $.noop, {_json: req});
		checkBatchRet(ret, [
			[0, jasmine.any(Number)],
			[E_PARAM],
			[0, sval]
		]);
		var newId = ret[0][1];
		ret = callSvrSync("fn", {f:"queryOne", sql:"SELECT id FROM ApiLog WHERE id=" + newId});
		expect(ret).toEqual(newId);

		// 有事务
		ret = callSvrSync("batch", {useTrans: 1}, $.noop, {_json: req});
		checkBatchRet(ret, [
			[0, jasmine.any(Number)],
			[E_PARAM],
			[E_ABORT]
		]);
		newId = ret[0][1];
		ret = callSvrSync("fn", {f:"queryOne", sql:"SELECT id FROM ApiLog WHERE id=" + newId});
		expect(ret).toEqual(false);
	});
	it("上下文参数", function () {
		var obj = {id: 99, fname: "cond", perms: ["emp","mgr"]};
		var req = [
			{ac:"fn", get:{f: "param", name: "obj"}, post:{ obj:obj } },
			{ac:"fn", get:{f: "param", name: "fname", fname:"{$-1.fname}"}, ref: ["fname"] },
			{ac:"fn", get:{f: "param", name: "{$2}", cond:"id={$1.id} and perm in ('{$1.perms[0]}', '{$1.perms[1]}')"}, ref: ["cond", "name"] }
		];
		var ret = callSvrSync("batch", $.noop, {_json: req});
		checkBatchRet(ret, [
			[0, obj],
			[0, obj.fname],
			[0, "id=99 and perm in ('emp', 'mgr')"]
		]);
	});
});
