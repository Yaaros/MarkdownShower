# 数据库级操作
## 创建
`create database name;`
## 使用
将当前sql脚本的运行域定义在name数据库里：
`use name;`
## 删除
`drop database name;`
(慎用)
## 事务
一般来讲，每条sql语句视为一个事务，可以关掉。
	在JDBC中使用Connection接口的setAutoCommit(false)来关闭自动提交，之后如果需要提交，必须手动使用conn.commit()方法提交，或者使用conn.rollback()方法进行显式回滚。
	在ODBC中使用SQLSetConnectOption(conn,SQL_AUTOCOMMIT,0)来关闭自动提交；使用SQLTransact(conn,SQL_COMMIT)来显式提交，或者通过SQLTransact(conn,SQL_ROLLBACK)来显式回滚。

## 权限
### 用户
除了根用户，我们还可以设计其他的用户用于操作这个数据库。
#### 创建用户
```
   CREATE USER 'username'@'hostname' IDENTIFIED BY 'password';
```
其中 `username` 是新用户的用户名，`hostname` 指定了用户可以从哪些主机连接，`password` 是用户的密码。
#### 删除用户
```
   DROP USER 'username'@'hostname';
```
#### 修改用户密码
```
   ALTER USER 'username'@'hostname' IDENTIFIED BY 'new_password';
```
#### 向用户授权
##### 所有权限
```
GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'hostname';
```
##### 部分权限
此处是给予某个表的增和查的权限
```
GRANT SELECT, INSERT ON database_name.table_name TO 'username'@'hostname';
```
#### 查看用户的权限
查看hostname上的username被授予的权限：
```
SHOW GRANTS FOR 'username'@'hostname';
```
#### 撤销用户权限
这里是删除查询权限:
```
REVOKE SELECT ON database_name.table_name FROM 'username'@'hostname';
```
#### 刷新权限
刷新权限是为了在修改权限后立即生效
```
FLUSH PRIVILEGES;
```
**注意，在MySQL中，使用revoke会自带一个刷新权限，不需要进行手动刷新。**
### 角色
角色和用户是不同的，具体来讲：
- **用户**: 用户是登录到MySQL服务器的账户。每个用户都有自己的用户名、密码和权限集。用户可以直接被赋予权限，也可以通过角色间接获得权限。  
  
- **角色**: 角色是一组权限的集合。角色本身不用于登录，它是作为权限管理的一种方式。你可以创建角色，将一组权限分配给该角色，然后将角色授予一个或多个用户。这样，用户就继承了角色的权限。使用角色可以简化权限管理，因为你可以更新角色的权限集，而不必为每个单独的用户更新权限。
#### 创建角色
```
   CREATE ROLE 'role_name';
```
#### 修改角色
```
   DROP ROLE 'role_name';
```
#### 向角色授权
实际上，这个授权的方法是同一个句子，只是把to后面的改成角色名而已。
```
GRANT SELECT ON database_name.table_name TO 'role_name';
```
#### 查看角色权限 
```
SHOW GRANTS FOR 'role_name';
```
#### 从角色撤销权限
```
REVOKE SELECT ON database_name.table_name FROM 'role_name';
```
#### **将角色授予用户**
```
GRANT 'role_name' TO 'username'@'hostname';
```
#### **从用户撤销角色**
```
REVOKE 'role_name' FROM 'username'@'hostname';
```
#### **设置默认角色**
```
SET DEFAULT ROLE 'role_name' TO 'username'@'hostname';
```
由此可以看到，

基本的授权语句形式都是
grant ... (on ...) to ...

撤销权限形式都是
revoke ...(on ...) from ...

查看权限形式都是：
show grants for ...

grant和revoke后面跟操作名称
或者all privileges;

on后面跟数据库名.表名或者数据库名.\*；

from/to/for后面跟用户名或者角色名;

用户名一定要后面跟@主机名

角色名直接是字符串
### 视图
待补充
### 模式
待补充
### 权限转移
在MySQL中，并没有直接的语法实现类似
```
grant select on department to Amit
with grant option 
```
这样的允许权限转移
只能通过：
1. show grants 
2. 查看1.的结果，手动输入grant 权限列表 on db.table to Y
3. revoke  权限列表 on db.table from X
来实现权限从X用户到Y用户的转变。
# 表级操作
## 创建
```
create table name(
	<属性字段>
	[初始化表级约束]
)comment '注释';
```
其中，属性字段的完整格式为：
`col_name,data_type,comment '注释',[约束]`
### data_type:
1. char(x)：长为x的字符
2. varchar(x)：至多长x的可变长度字符
3. tinyint：短整数（0~255），+byte
4. smallint：(-32768~32767),short
5. integer/int：与其它语言相同的int
6. bigint：指数位63次方（int是31次方）
7. decimal(x,y)/numeric(x,y):小数。精度为x，小数后的位数为y，这里的精度是总位数的意思。
8. timestamp/date/time：date=年月日,time=时分秒,timestamp=date+time
9. array/multiset:前者是固定长度的有序集合，后者是可变长度的无序集合.
10. xml:xml数据
### 约束
约束一共有六种，分为表级约束和列级约束。前两者为表级约束，包括主码（主键）和外码（外键）；后四个为列级约束，包括非空约束、唯一性约束、检查约束和缺省值约束。
1. 主键（primary key）： 从功能上来看，primary key = not null + unique，但是主键是表级的，同时具有很高的灵活度。我们可以定义`primary key (A,B)` 来使得A列和B列的组合有唯一标识。注意，这里定义的主键将不具有自定义名称，mysql会以一个固定格式为其创造一个名称。如果需要自定义名称，可以使用`constraint KeyName primary key (attribute)`
2. 外键（foreign key）：保证此表的数据匹配到（references）另一个表的数据列（这被称为参照完整性）。完整格式为:`constraint KeyName foreign key (attribute1) references TableName(attribute2)
3. NOT NULL:不接受空值（SQL中的空值非常特殊，判空必须用IS NULL）。在建表时的使用方法为`AttributeName data_type [注释] not null`实际上，所有的列级约束都是这样用的，如果在同一条属性下需要多个列级约束，约束和约束之间只需要空格即可。这样做创造的约束也不具有自定义名称，但对于列约束来说一般用不到。
4. Unique：属性值唯一。
5. check：check后跟一个括号代表约束表达式，比如and/or/between等等知识可以在这里使用。
6. default：缺省值指的是如果在插入数据时不给这个位置赋值，该位置自动取值为什么（如果没有缺省值约束则为NULL）
约束除了在建表时可以添加外，在操作表结构命令alter table中也可以使用。
### 自增
自增是我们在生成ID的时候常用的一种方式，对于不同的数据库系统我们使用不同的表述方式。在数据库原理课上，我们写作
```
ID number(5) generated always as identity
```
在MySQL中，我们使用**auto_increment**关键字:
```
CREATE TABLE users (
    id int AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20)
);
```
向含有自增列的表中插入数据时【必须使用】指定属性顺序的insert语法，且不能向id列插入数据。
在MySQL中，定义自增的起始值和增量是允许的，但是定义自增上下界是不支持的。
定义起始值为100：
```
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20)
) AUTO_INCREMENT=100;
```
定义增量是一个【服务器级的命令】
`SET @@auto_increment_increment = 2;
如果需要限定上下界，则需要使用触发器或者在更上层的应用程序中限制。

### 扩展
#### like关键字构造相似表
通过like关键字，我们可以创建一个与已存在的表结构相同的表，例如：
```
create table temp like instructor
```
#### 储存查询结果
一般来说，将查询结果暂存以便于多次查看是一个很有用的手段，例如：
```
create table t1 as
	(select *
	 from instructor 
	 where dept_name = 'Music')
with data
```
**with data**是指：将查询的数据也一并载入。
如果不加with data子句，那么只会创建一个只有查询好的表结构的空表。
## 操作表结构
alter table系列命令
### 添加列
`alter table TableName add column col_name data_type`
### 删除列
`alter table TableName drop column col_name`
### 改变列的数据类型
`alter table TableName modify column col_name data_type`
[[3.5代语言]]
### 添加约束
#### 表级约束
##### 主键
`alter table TableName add constraint KeyName primary key (attribute)`
##### 外键
`alter table TableName add constraint KeyName foreign key (attribute) references TableName2(attribute2) [on update cascade]`
on update cascade:级联修改功能，如果指向的表的数据更改则这一列也会更新.

外键还有很多可以添加的约束，我们可以对前缀集合{on delete,on update}和后缀集合{no action,restrict,cascade,set null,set default}做笛卡尔积获得十种约束。
但实际上，no action和restrict是类似的，都是禁止reference起点擅自删除/更新的效果，区别只是前者会报错后者不报错。真正有用的就是后三个，而且on update和set null/set default组合也很难遇见。常用的就这些：
1. on delete cascade 级联删除
2. on update cascade 级联更新 
3. on delete set null 删后补null
4. on delete set default 删后补缺省值
#### 列级约束
形如
```
alter table sc_name  
add constraint 'SUSU' UNIQUE (Sno); 
```
其中sc_name对应表名，SUSU对应新的约束名，UNIQUE对应约束类型，最后括号里的对应约束的列。
### 删除约束
`alter table table_name drop constraint ConstraintName;`
这里如果需要查看约束的名称要用mysql系统自带的记录信息（这些会在另一个笔记中写），这里写一个示例:
```
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = '数据库名' 
  AND TABLE_NAME = '表名';
```
换句话说，我们这里是在查“数据库的数据库”
## 索引
对于庞大的数据表来说，查询通常只涉及其中的一小部分记录，但是，如果每次都筛选所有的元组内容会过于复杂，降低查询效率。因此，程序员可以通过DDL（**创建索引的语句算DDL**）来创建和删除索引.
### 分类
索引分为五种：
 - **主键索引** (`PRIMARY KEY`): 每个表只能有一个主键索引，它唯一标识表中的每行数据，并且不允许NULL值。  
   - **唯一索引** (`UNIQUE`): 确保列中的所有值是唯一的，类似于主键，但允许有NULL值。  
   - **普通索引** (`INDEX`): 用于加快访问数据的速度，没有唯一性限制。  
   - **全文索引** (`FULLTEXT`): 用于全文搜索，特别是在MyISAM和InnoDB表中用于文本搜索的优化。  
   - **空间索引** (`SPATIAL`): 用于空间数据类型，例如地理数据存储。
首先，主键就是一种索引；其次，unique关键字指的不是唯一性约束unique，而是unique index。
### 创建索引 
例： Course  的索引
为课程名建立唯一性索引 ：Ix_course_cname
```
create unique index ix_course_cname  
on course (Cname);
```
### 删除索引
例：删除索引 course 表的索引 IX_course_cname
```
drop index ix_course_cname on course;
```
注意，主键是表结构的一部分，想删除主键是不能使用drop index命令的，但是其他四种索引都是可以使用本命令删除的。
### 查看索引
```
show index from student;  
show index from sc;  
show index from course;
```
# 列级操作
## insert插入
插入有两种：
### 第一种是插入具体的值：
```
insert into schema
	values(...)
```
如果这样做，值的排列顺序必须和schema的定义顺序一致，如果记不清这个顺序可以换成：
```
insert into schema(order1)
	values(...)
```
这样可以按order1所示顺序插入值。如果不想插入完整的一行，可以只插入那些在order1里写好的值。
### 第二种是插入子查询的结果
对应数据库理论课的[[数据库原理#插入操作]]
```
insert into schema(Sid,Sname)
	select ID,name
	from schema_2
```
注意，由于查询功能的强大，我们甚至可以做到这样：
```
insert into schema(Sid,Sname,Salary)
	select ID,name,18000
	from schema_2
```
这样从schema_2里拿到的只是姓名和id，而工资是我们手动预设的。
## delete删除
删除其实没多少要讲的，只是在删除时几乎都要使用查询条件where子句（因为如果不限定条件删除，由于删除的基本单位是元组，所以会把整个表删空）
```
delete from schema
where salary<3000
```

## update更新
更新，指的是在不改变元组的所有值的条件下对某个属性的值的更改。
### 基础用法
把工资小于平均值的涨5%：
```
update schema 
set salary = salary*1.05
where salary < (
	select avg(salary)
	from schema
);
```
### case结构
可以说是SQL里的switch语句.

假设我们有一个名为 `Employees` 的表，其中包含员工的 `ID`、`Name` 和 `Salary`。我们想要根据员工的当前薪资来提供不同比例的加薪：  
  
- 如果薪资小于1000，则加薪10%  
- 如果薪资在1000到2000之间，则加薪5%  
- 如果薪资高于2000，则加薪2%  
- 如果薪资信息不可用（可能为NULL），则不进行更新  
  
相应的 `UPDATE` 语句如下：
```
UPDATE Employees
SET Salary = CASE
  WHEN Salary < 1000 THEN Salary * 1.10
  WHEN Salary 
	  BETWEEN 1000 AND 2000 
	  THEN Salary * 1.05
  WHEN Salary > 2000 THEN Salary * 1.02
  ELSE Salary
END;
```

## select查询
关于查询，这里只写基本的结构，专开一个大标题写查询语句的所有内容。
想使用基本的查询语句，只需要简单的
```
select AttributeName (as ...)
from schema 
[where condition];
```

查询可以从不同的表里一步查出数据，最常见的是这样的场景（这个例子写在这里是为了说明from子句也可以用更名运算as，也可以输入多张表）
```
select T.name,C.course_id
from teachers as T,
	 courses as C
where T.ID = C.ID;
```

在MySQL中，as关键字可以省略。但是，对于比较复杂的场景**不建议省略**。

【其实写到这我感觉之前的组织形式已经不是很好了，首先，select语句要写的东西显然和增删改不是一个量级的，根本不应该这么放；其次，create assertion我放到约束那里还可以，但是视图我感觉真不好说这玩意是表级的还是列级的。这也就是即使是黑皮书《数据库系统原理》也不敢把sql语句按照操作层级来分级的原因。现在我还差查询（单独拿出来）没写】

## 空值

### 产生情况
1. 外连接和笛卡尔积生成的大量空值
2. insert的时候本身没有插入一整行，而是把某些列留空了，而这些列又没有定义默认值，就会产生空值
3. 插入时或更新时 刻意插入或set的null
4. 外键约束会导致null：这是一种特殊的情况，如果我们把外键约束设置成`on delete set null`就会在删除reference终点的元组时，起点这边的值会被设为null
5. 其他由于数据库的迁移和外部原因造成的null值。
### 如何处理
SQL中的空值非常特殊,它与C/Java/JavaScript中的类似处理都是不同的。在SQL中，带null的运算都会产生一个新的布尔结果：unknown，甚至null=null的返回值都是unknown。这就需要我们理解unknown的特性：
1. true and unknown = unknown 
2. false and unknown = false 
3. unknown and unknown = unknown
4. true or unknown = true
5. false or unknown = unknown
6. unknown or unknown = unknown
7. not unknown = unknown 
8. 如果布尔表达式的值为unknown，在where子句中会视为不满足条件。
9. count(\*)函数会把null计入，但是count(attr1)不会把null计入，因此如果想计算null的个数可以求count(\*)-count(attr)
10. 其他聚合函数彻底忽略null值，avg函数只计算非null平均值。
11. 如果一列全是null，除count外的聚合函数会返回null【important】
我们的测试方法是使用is null或者is not null来处理null值，另外，对于一个布尔表达式，我们也可以在后面加上is unknown或者is not unknown来使其强制获得true和false。
# 查询
查询，数据库的重中之重。现代数据库的主要优化重点就是查询方面的速度。在这里，我将按照如下顺序写查询语句的笔记：
0. 单关系查询
1. 多关系查询与星号（\*）的使用
2. 字符串运算与匹配
3. 集合运算（关系代数运算的一部分）
4. 聚集函数和having子句
5. 嵌套子查询和with子句
6. 连接问题
7. 视图
8. 底层逻辑
## 单关系查询
查询所有老师的姓名：
```
select name
from teachers 
```
### distinct关键字
在select后面加入distinct强制去除重复：
```
select distinct 
```
在select后面加入all表示不去除重复：
```
select all
```
注意，这只是显式地声明，实际上默认就是不去重的。
### 广义投影
在[[数据库原理#广义投影]]里讲过这一点，通过select语句产生投影，通过含运算符的select语句产生广义投影。
例：
涨工资是
```
update schema 
set salary = salary*1.05
where salary < (
	select avg(salary)
	from schema
);
```
如果我们不想真的涨工资，而是拿出来做个样子那就是：
```
select name,salary*1.05
from schema 
where salary < (
	select avg(salary)
	from schema
);
```
### 排序
order by子句放在select语句的最后，对数据进行【升序排列】。如果需要降序，需要加desc关键字。
例：
按salary第一关键字降序，name第二关键字升序：
```
select *
from employees 
order by salary desc,name asc;
```
## 多关系查询与星号 
找出所有的教师姓名以及他们所在系的建筑名称

对于这个需求最好是使用多关系查询，我为什么不查询【系的名称】，因为查系名称最好用后面连接和前面更名那块的知识防止名称冲突。

```
select name,building
from instructor,department 
where instructor.dept_name
	  = department.dept_name;
```
### 星号
星号，SQL语句中的通配符，通常有以下用途：
#### 选择所有列/获取全表信息
```
select * from table
```
#### 连接场景中某个表的所有列
如果我们在连接时只需要b的某一列，但是需要a的所有列，此时可以这样做
```
select a.*,b.col_name
from astarot as a
join billarot as b
on a.time = b.time
```
#### count函数
`count(*) from ...`用于返回某个表里的行数。一般来说使用的场景是含有极其复杂的子查询场景。
## 字符串运算与匹配 
SQL中的字符串是单引号引起来的。
### 相等运算
众所周知，在Java中字符串相等不建议用双等号比较，而要使用在String类里重写了的equals方法比较之。在数据库中，情况更为复杂。

由于sql本身是大小写不敏感的，因此MySQL和SQL Server在比较字符串相等时不区分大小写。但是，其他一些数据库可能是区分大小写的。
### 内置函数
关于字符串，很多语言都有内置函数，MySQL也不例外。这里有一些常见的内置函数举例：
#### Hello World
使用concat()函数可以连接多个字符串，比如在sql中print("Hello World"):
```
select concat('Hello',' ','World');
```
#### 去除空格
类似JavaScript/Vue，trim方法可以去除空格。但是，在MySQL中的trim用法与其他数据库都不太一样：
1. trim('String')会去除字符串【两端的空格】
2. trim(both '$' from 'String')会去除字符串两端的美元符号
3. trim(leading/trailing '$' from 'String')会去除左侧/右侧的美元符号
4. 除此以外还有更方便的去除单端空格的办法：ltrim('String')（去除左侧空格）和rtrim('String')（去除右侧空格）
#### 转大小写
upper('String')
lower('String')
#### 长度
长度分为字节长度和字符长度
字节长度：length('String')
字符长度：char_length('String')
#### 子串
如果要获取左侧5个字符：
```
SELECT LEFT('Hello World!', 5); 
```
右侧：
```
SELECT RIGHT('Hello World!', 6); 
```
更为强大的substring方法：
```
SELECT SUBSTRING('Hello World!', x, y);
```
从第x个字符开始读y个字符

### like关键字 
like关键字用于设定where子句的约束条件。
like关键字支持的模式匹配从表面上看是很简单的，他只有两条基本规则：
1. 百分号'%'匹配任意子串
2. 下划线'\_'匹配任意一个字符
另外，可以通过escape关键字定义转义符，比如`like 'ab\%ab' escape '\'`用于匹配以’ab%ab‘开头的所有字符串

但是，like关键字的匹配功能是很强大的，它的功能只有见过才了解：

例1：
查询名字里含“明”字的人数：'%明%'
```
select count(*)
from (
    SELECT *
    FROM student
    WHERE Sname LIKE '%明%'
     )
AS subquery;
```
这里可以区分一下以下关键字的匹配结果：
1. ‘\_明%’：匹配明字前有一个字符，明字后有任意个字符（包括0个）的字符串。
2. '%明%'：匹配明字在字符串的任意位置的字符串。
3. ‘%\_明%’：在1.的基础上可以增加任何前缀的字符串。

例2：
查找以 'end' 结尾的所有值 
```
SELECT * FROM table_name WHERE column_name LIKE '%end';
```

例3：
查找第X个字符是Y的字符串，只需要先写X-1个下划线，后写Y再写%号即可。
## 集合运算（关系代数运算的一部分） 
集合的并交差运算对应（union,intersect,except），这些运算都是默认去重的，如果想保留重复项就必须在后面加all，变成(union all,intersect all,except all)

具体用法是：
设X,Y是select语句，并：
```
(X) union (all) (Y)
```
交：
```
(X) intersect (all) (Y)
```
差：
```
(X) except (all) (Y)
```
## 聚集函数和having子句 
[[数据库原理#聚集函数]]
[[数据库原理#分组聚集]]
在这里不多赘述原理性的东西，举几个例子：

#2.6 查询平均分大于80分的学生学号及平均分 
/\*在 SQL 中，聚合函数不能直接用于 WHERE 子句中，  
因为 WHERE 子句是在数据行被分组前进行过滤的，而聚合函数是在数据行被分组后计算的。  
可以通过使用 HAVING 子句来过滤基于聚合函数计算结果的数据行。  
Having 子句在group by 后面\*/  
```
select Sno,  
       AVG(Grade) AS AvgGrade  
from sc  
group by Sno  
having AvgGrade > 80  
order by AvgGrade;
```
从这里可以看到，在MySQL中，如果在多处使用聚集函数，由于我们在这些地方所指的意义相同，因此聚集函数要进行更名，并使用重命名的结果填充后面的部分。
#2.7 统计选修课程超过 2 门的学生学号  
```
select Sno  
from sc  
group by Sno  
having COUNT(Cno) > 2;
```


## 嵌套子查询和with子句 
### in关键字
在where中可以写一个
```
where attr in (
	select attr 
	from ...
)
```
表示如果元组与在子查询结果中的元组对应列attr一致返回true
这也是最常用的嵌套子查询方法。
### 集合比较与some关键字
与in类似，比较符+some+子查询的结构也是用在where子句中，用于筛选比子查询结果大或小的部分元组。’=some‘等价于‘in’，但是<>some与not in不等价。更详细地讲：
1. >some是指比子查询结果中的至少某一个要大，小于同理；
2. >=some是指比子查询结果中的至少要大于等于子查询结果中的某一个，小于等于同理；
3. =some指的是与子查询结果中的某一个相等，也就是在子查询的结果中
4. <>some是指不等于子查询结果中的某一个，这条用的很少，因为几乎都返回true，这可不是”与所有子查询结果都不同“，如果<>some返回true，是完全有可能存在于子查询结果中的。
all关键字也可以代替some的位置，此时，<>all就等价于not in。

some在MySQL中可以用any替代。
### 空集检查与exists关键字
这个关键字完全用于检查子查询是不是空集。

注意，这里常常搭配一种技巧：在内层子查询里，不一定要select一堆属性，反正我们外层只关心有没有结果，在MySQL中可以使用select 1来表示不关心选哪些列，只关心这样的元组存不存在。

例：
#4.2 查询没有选修1002 课程的学生的学生姓名
```
select Sname 
from Student s
where not exists(
	select 1
	from sc
	where sc.Cno = 1002 
	and sc.Sno = s.Sno
)
```

### 重复元组存在性测试
在数据库原理中会讲到`where unique(子查询)`是一种测试子查询结果中是否存在重复元组的方法，若没有重复返回true。但是，MySQL不支持这种语法，如果需要实现类似功能，这里举个例子：
找出2017年中至多开设1次的所有课程：

如果支持unique语法，可以这么写： 
```
select T.course_id 
from course as T 
where unique 
	(select R.course_id 
	 from section as R 
	 where T.course_id = R.course_id 
	 and R.year = 2017);
```  
在MySQL中，上述应该改成：
```
SELECT T.course_id
FROM course AS T
WHERE T.course_id IN (
    SELECT R.course_id
    FROM section AS R
    WHERE R.year = 2017
    GROUP BY R.course_id
    HAVING COUNT(R.course_id) <= 1
);

```
  这里使用count(R.course_id)而不是count(\*)是因为我们不想计算空值出现了几次。

### from子句中的子查询
子查询不仅可以用在where的判定条件上，还可以用在from子句里。MySQL规定from子句中的每个子查询的结果关系必须被设置一个别名，即使没有在外层用到这个名字。
这里的意思不是select出的属性要更名，而是对于这个子查询，在括号后面必须加上
`as subquery`作为更名

在DataGrip里，不加`as subquery`并不会报错，而是会弹警告，但实际上还是出错的。
### with子句
with子句是创造公共表表达式的方法，当我们的from子句需要进行子查询嵌套时，我们可以将其换成在select语句前面写一段with+新表名字+as+（子查询）。这一点在from后面只有单个表时并不突出，但是，如果from子句进行了多关系查询，尤其是如果实现了关系之间的调用，那么会是这样的：
这里要查询工资总额大于所有系平均工资总额的所有系:
```
select dept_name
from (
	select dept_name,sum(salary) as st
	from instructor 
	group by dept_name
) as dept_total,
(
	select avg(st) as at
	from dept_total
) as dept_total_avg
where dept_total.st > dept_total_avg.at
```
这个的可读性就没有下面的with子句要好：
```
with dept_total(dept_name,value) as
	(select dept_name,sum(salary)
	 from instructor
	 group by dept_name),
	 
	 dept_total_avg(value) as
	 (select avg(value)
	  from dept_total)
select dept_name 
from dept_total,dept_total_avg 
where dept_total.value > 
	  dept_total_avg.value
```
实际上，with子句是一种模块化思想的体现

### 嵌套子查询的综合应用

使用嵌套子查询可以对同一种功能实现不同的写法，最经典的案例是实验题里的这一道：

查询平均分最高的学生学号及平均分

1.使用LIMIT的做法：(LIMIT)
```
select Sno,AVG(grade) as avgG
from sc
group by Sno 
order by avgG desc
limit 1
```
2.使用子查询+max函数的做法
```
SELECT Sno, AVG(sc.Grade) AS AvgGrade  
FROM sc 
GROUP BY Sno  
HAVING AvgGrade = (  
    SELECT MAX(AvgGrade2)  
    FROM (  
        SELECT AVG(Grade) AS AvgGrade2 
        FROM sc  
        GROUP BY Sno  
    ) AS SubQuery  
)  
limit 1;
```
3.使用子查询+all的做法：
```
select s.Sno, AVG(sc.Grade) AS AvgGrade  
from sc 
group by Sno  
having AvgGrade >= ALL(  
    select AVG(Grade)  
    from sc  
    group by Sno  
);
```
## 连接
在select的时候，如果需要查询其他表中的信息，但不想进入多关系查询，可以使用连接的方法。连接在[[数据库原理#连接]]已经讲过所有的连接类型，平时几乎都用自然连接join关键字。

比如我们的Student，SC，Course三张表，查询选修“数据库原理”课且成绩 80 以上的学生姓名(不用嵌套及嵌套2种方法）

不用嵌套：
```
select Sname 
from student s
join sc on sc.Sno = s.Sno
join course c on c.Cno = sc.Cno
where Cname = '数据库原理' and sc.Grade>80;
```

嵌套：
```
select Sname
from student s
where s.Sno in (
	select sc.Sno 
	from sc
	where sc.Grade>80 and sc.Cno in(
		select c.Cno
		from course c
		where c.Cname = '数据库原理'
	)
)
```
连接操作对于精心设计的表是非常有用的（因为我们必须在多个表之间获得信息）
## 视图
with子句通过给子查询一个名称方便就近使用，而这里的视图可以把这一查询结果提供到单个查询之外的地方，在被显式删除之前，视图总是可用的。view做的操作实际上是把查询结果存在了数据字典中。

with子句中的as是名字在前定义在后，在这里也是一样的。
### 创建视图
列出物理系在2017年秋季学起开设的所有课程段，以及每个课程段在哪栋建筑的哪间房屋授课：
```
create view physics_fall_2017 as
	select course.cid,sec_id,
		building,room_number
	from course,section 
	where course.cid = section.cid
		and course.dept_name = 'Physics'
		and section.semester = 'Fall'
		and section.year = 2017;
```

如果需要对属性写入别名，那么可以像with子句中的结构那样做：
```
create view department_total_salary(name,total_salary)
as select dept_name,sum(salary)
   from instructor 
   group by dept_name;
```
这里给sum(salary)更名为total_salary方便使用。
类似于with子句：
```
with dept_total(dept_name,total_salary) as
	(select dept_name,sum(salary)
	 from instructor
	 group by dept_name),
......
```

### 使用视图
视图是为了方便我们后续的使用，比如
选择Watson大楼在2017年球季开设的物理课课程号cid:
```
select course.cid
from physics_fall_2017 
where building = 'Watson';
```
视图也可以用于定义另一个视图的表达式：
```
create view physics_fall_2017_watson as
	select cid,room_number 
	from physics_fall_2017 
	where building = 'Watson';
```
## 编译层
在执行select语句的时候，编译顺序与书写的顺序是不同的。大体上的编译顺序是：
from->join...on...->where->group by->having->select->order by
遇到子查询时搁置当前循环进入子循环，并把子循环结果放在对应位置上（from或者where的一部分）
# 数据库的外部使用
JDBC和ODBC以及在Python中的使用方法。