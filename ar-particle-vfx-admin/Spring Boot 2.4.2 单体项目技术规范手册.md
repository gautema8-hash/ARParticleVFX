# Spring Boot 2.4.2 单体项目技术规范手册

本规范适配 **JDK 1.8 + Spring Boot 2.4.2 + Tomcat 9.0.93 + PostgreSQL + Log4j2 + Redis(Jedis 2.9.0)** 技术栈，覆盖目录结构、编码规范、分层规则、数据库/缓存/日志规范，可直接作为团队开发约束文件落地。

------

## 一、项目技术栈总览

| 技术组件    | 版本                       | 说明                                                         |
| ----------- | -------------------------- | ------------------------------------------------------------ |
| JDK         | 1.8                        | 编译与运行版本，使用 Java 8 核心特性（Lambda/Stream/Optional） |
| Spring Boot | 2.4.2                      | 项目主框架，内置 Web 容器                                    |
| Tomcat      | 9.0.93                     | 覆盖 Spring Boot 默认内置 Tomcat 版本，也支持外置部署        |
| 数据库      | PostgreSQL 10+             | 关系型数据库，驱动适配 42.2.x 稳定版                         |
| ORM 框架    | MyBatis 3.5.x + PageHelper | 数据持久层，支持自定义 SQL 与分页                            |
| 缓存        | Redis + Jedis 2.9.0        | 缓存客户端，配合 Spring Data Redis 封装                      |
| 日志框架    | Log4j2 2.17.x              | 替换 Spring Boot 默认 Logback，使用高版本修复安全漏洞        |
| 构建工具    | Maven 3.6+                 | 项目依赖管理与打包                                           |
| 编码格式    | UTF-8                      | 全局统一编码，含源码、配置文件、编译输出                     |

------

## 二、项目标准目录结构

采用标准 Maven 单模块结构，按业务分层 + 功能模块划分目录，所有包遵循**域名反写 + 业务模块**规则。

```
project-name
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com
│   │   │       └── company
│   │   │           └── projectname  # 项目根包，启动类必须放在此层
│   │   │               ├── ProjectApplication.java        # Spring Boot 启动类
│   │   │               │
│   │   │               ├── common                        # 公共基础模块（全项目可引用）
│   │   │               │   ├── constant                  # 常量类
│   │   │               │   │   ├── RedisKeyConstant.java # Redis Key 常量
│   │   │               │   │   └── SysConstant.java      # 系统全局常量
│   │   │               │   ├── enums                     # 枚举类
│   │   │               │   │   ├── ResultCodeEnum.java   # 响应状态码枚举
│   │   │               │   │   └── BusinessTypeEnum.java # 业务类型枚举
│   │   │               │   ├── exception                 # 异常体系
│   │   │               │   │   ├── BusinessException.java# 自定义业务异常
│   │   │               │   │   └── GlobalExceptionHandler.java # 全局异常处理器
│   │   │               │   ├── result                    # 统一返回结果
│   │   │               │   │   └── Result.java           # 接口统一响应封装
│   │   │               │   ├── utils                     # 工具类
│   │   │               │   │   ├── RedisUtils.java       # Redis 操作工具
│   │   │               │   │   └── DateUtils.java        # 日期工具
│   │   │               │   └── validator                 # 自定义参数校验注解
│   │   │               │
│   │   │               ├── config                        # 配置类（所有第三方组件配置）
│   │   │               │   ├── MybatisConfig.java        # MyBatis 分页、插件配置
│   │   │               │   ├── RedisConfig.java          # Redis 连接池、序列化配置
│   │   │               │   ├── WebConfig.java            # 跨域、拦截器、资源映射
│   │   │               │   └── TransactionConfig.java    # 事务管理配置
│   │   │               │
│   │   │               ├── controller                    # 控制层（接口入口）
│   │   │               │   ├── system                    # 系统模块接口
│   │   │               │   └── business                  # 业务模块接口
│   │   │               │
│   │   │               ├── service                       # 业务层接口
│   │   │               │   ├── system
│   │   │               │   └── business
│   │   │               │
│   │   │               ├── service.impl                  # 业务层实现类
│   │   │               │   ├── system
│   │   │               │   └── business
│   │   │               │
│   │   │               ├── dao                           # 数据访问层
│   │   │               │   └── mapper                    # Mapper 接口
│   │   │               │       ├── system
│   │   │               │       └── business
│   │   │               │
│   │   │               ├── entity                        # 实体对象集
│   │   │               │   ├── po                        # 持久化对象（与数据库表一一对应）
│   │   │               │   ├── dto                       # 数据传输对象（前端入参）
│   │   │               │   ├── vo                        # 视图对象（返回前端）
│   │   │               │   └── bo                        # 业务对象（层间内部传输）
│   │   │               │
│   │   │               └── aspect                        # 切面类（日志、权限、参数校验）
│   │   │
│   │   └── resources
│   │       ├── mapper                      # MyBatis XML 文件，与 dao/mapper 目录一一对应
│   │       │   ├── system
│   │       │   └── business
│   │       ├── config                      # 多环境配置文件
│   │       │   ├── application-dev.yml     # 开发环境
│   │       │   ├── application-test.yml    # 测试环境
│   │       │   └── application-prod.yml    # 生产环境
│   │       ├── application.yml             # 主配置文件（环境切换、公共配置）
│   │       ├── log4j2-spring.xml           # Log4j2 日志配置
│   │       ├── static                      # 静态资源（js/css/图片，前后端分离可删除）
│   │       └── templates                   # 页面模板（Thymeleaf等，前后端分离可删除）
│   │
│   └── test
│       └── java
│           └── com
│               └── company
│                   └── projectname
│                       ├── controller      # Controller 层单元测试
│                       └── service         # Service 层单元测试
│
├── pom.xml                                 # Maven 依赖配置
└── README.md                               # 项目说明文档
```

### 目录核心约束

1. **根包约束**：启动类必须放在根包下，通过 `@SpringBootApplication` 自动扫描子包，禁止反向引用。
2. **分层单向依赖**：`controller → service → dao`，禁止反向依赖、跨层直接调用数据库。
3. **业务模块隔离**：system/business 等子模块按业务域划分，不同业务模块的类禁止交叉调用内部私有方法。
4. **公共层边界**：`common` 只能存放无业务逻辑的通用代码，禁止写入业务逻辑。

------

## 三、Java 编码规范（Java Rule）

### 3.1 命名规范

| 类型          | 规则                                                | 正例                                       | 反例                                                         |
| ------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 包名          | 全小写，单词间无分隔符，按业务层级划分              | `com.company.project.user.controller`      | `com.company.project.UserController`、`com.company.project.user_controller` |
| 类/接口       | 大驼峰命名，见名知意；接口不加 `I` 前缀             | `UserService`、`UserServiceImpl`           | `IUserService`、`userService`                                |
| 方法名        | 小驼峰，动词/动词短语开头                           | `getUserById`、`saveUser`、`batchDelete`   | `UserGet`、`get_user`                                        |
| 普通变量      | 小驼峰，禁止拼音缩写，禁止单字符（循环变量除外）    | `userName`、`orderList`                    | `name1`、`yongHuMing`、`u`                                   |
| 常量          | 全大写，下划线分隔，放在常量类或枚举中              | `MAX_RETRY_COUNT`                          | `maxRetryCount`、`MaxCount`                                  |
| 布尔变量      | 禁止 `is` 前缀，避免序列化/getter 冲突              | `deleted`、`success`                       | `isDeleted`、`isSuccess`                                     |
| 抽象类/异常类 | 抽象类以 `Abstract` 开头，异常类以 `Exception` 结尾 | `AbstractBaseService`、`BusinessException` | `BaseService`、`BusinessError`                               |

### 3.2 代码格式规范

1. 缩进使用 **4 个空格**，禁止使用 Tab 字符；行宽最大 120 字符，超长代码必须换行。
2. 方法之间空 1 行，逻辑块之间（如分支、循环）可空 1 行分隔，禁止连续空行超过 2 行。
3. 导入包禁止使用 `*` 通配符，未使用的包必须删除，导入顺序：Java 标准包 → 第三方包 → 项目内部包。
4. 左大括号 `{` 不换行，紧跟语句末尾；右大括号 `}` 单独一行；`if/for/while` 即使只有一行代码也必须加大括号。

### 3.3 注释规范

1. **类注释**：所有类必须加 JavaDoc 注释，说明类功能、作者、创建时间。

```
/**
 * 用户业务接口
 *
 * @author 作者名
 * @date 2025-01-01
 */
public interface UserService {
}
```

1. **方法注释**：public 方法必须加 JavaDoc，说明方法功能、入参含义、返回值、异常场景。
2. **复杂逻辑注释**：业务分支、核心算法、特殊处理逻辑必须加单行/多行注释，说明设计思路。
3. 禁止无用注释：禁止注释掉的代码提交到仓库，禁止“修改人、修改时间”类的冗余注释。

### 3.4 异常处理规范

1. 业务异常统一抛出自定义 `BusinessException`，携带错误码与错误信息，禁止直接抛出 `RuntimeException`。
2. 禁止捕获异常后不处理（空 catch 块），至少打印 error 级别日志；禁止捕获 `Throwable`。
3. 事务方法中，必须保证异常能被事务切面捕获，禁止手动捕获异常不抛出导致事务不回滚。
4. 第三方调用、远程接口必须捕获异常并降级处理，禁止异常向上透传影响主流程。
5. 全局异常由 `GlobalExceptionHandler` 统一捕获封装，返回标准 `Result` 格式，禁止前端看到堆栈信息。

### 3.5 集合与数据类型规范

1. 集合初始化时指定初始容量，如 `new ArrayList<>(16)`，避免频繁扩容。
2. 遍历集合删除元素必须使用迭代器 `Iterator`，禁止 foreach 循环中调用 remove/add。
3. 空集合返回空集合（`Collections.emptyList()`），禁止返回 null，避免调用方空指针。
4. 日期统一使用 `java.time` 包（LocalDateTime/LocalDate），禁止使用 `java.util.Date`、`Calendar`。
5. 金额统一用 `BigDecimal`，禁止用 float/double 计算；BigDecimal 比较用 `compareTo`，禁止用 `equals`。
6. 所有 POJO 类必须实现 `Serializable` 接口，生成固定 serialVersionUID。

### 3.6 Java 8 特性使用规范

1. 集合遍历、转换优先使用 Stream 流，但禁止在循环中写复杂业务逻辑，保证可读性。
2. 空值判断优先使用 `Optional`，但禁止在 POJO 属性、方法入参中使用 Optional。
3. Lambda 表达式超过 3 行必须抽为独立方法，禁止写大段匿名内部逻辑。
4. 禁止滥用函数式接口，核心业务逻辑优先用常规写法，保证可维护性。

------

## 四、文件与目录管理规范

### 4.1 目录边界规范

1. 新增业务模块必须在 controller/service/dao/mapper/entity 下对应创建子目录，保持层级一致。
2. 工具类必须放在 `common.utils` 下，禁止在业务代码中散落工具方法；通用工具方法必须静态化。
3. 配置类必须放在 `config` 包下，按第三方组件拆分，禁止把配置写在启动类或业务类中。

### 4.2 文件命名规范

| 文件类型       | 命名规则             | 示例                                     |
| -------------- | -------------------- | ---------------------------------------- |
| Controller 类  | 业务名 + Controller  | `UserController.java`                    |
| Service 接口   | 业务名 + Service     | `UserService.java`                       |
| Service 实现类 | 业务名 + ServiceImpl | `UserServiceImpl.java`                   |
| Mapper 接口    | 表名 + Mapper        | `SysUserMapper.java`                     |
| Mapper XML     | 与 Mapper 接口同名   | `SysUserMapper.xml`                      |
| PO 实体        | 表名（驼峰）         | `SysUser.java`                           |
| DTO/VO         | 业务场景 + DTO/VO    | `UserQueryDTO.java`、`UserDetailVO.java` |
| 配置类         | 组件名 + Config      | `RedisConfig.java`                       |
| 异常类         | 场景 + Exception     | `BusinessException.java`                 |

### 4.3 配置文件规范

1. 主配置 `application.yml` 仅存放公共配置与环境切换，业务配置放在对应环境文件中。
2. 配置项命名：全小写，单词间用中划线分隔，按模块分层。

```
# 正确示例
spring:
  datasource:
    url: jdbc:postgresql://127.0.0.1:5432/test_db
  redis:
    host: 127.0.0.1
    port: 6379
```

1. 敏感信息（数据库密码、Redis 密码）生产环境禁止明文配置，必须通过环境变量或配置中心注入。
2. 多环境激活：主配置中通过 `spring.profiles.active` 指定当前环境。

### 4.4 Mapper XML 文件规范

1. XML 文件必须与 Mapper 接口同包名对应，`namespace` 必须写 Mapper 接口全限定名。
2. 禁止在 XML 中写硬编码常量，通过 `<sql>` 标签抽取公共字段、公共条件。
3. 复杂 SQL 必须加注释说明逻辑；禁止使用 `select *`，必须明确查询字段。
4. 参数传递：单个参数可直接引用，多个参数必须在 Mapper 接口加 `@Param` 注解。

------

## 五、分层开发规范

### 5.1 Controller 层规范

1. 只做参数接收、参数校验、调用 Service、返回结果，禁止写入业务逻辑。
2. 所有接口返回统一 `Result<T>` 对象，禁止直接返回实体、字符串或 null。
3. 入参校验使用 `@Valid` + 校验注解，复杂校验自定义校验器，禁止在 Controller 手写大量 if 判断。
4. 请求路径遵循 RESTful 风格：GET 查询、POST 新增、PUT 修改、DELETE 删除；路径全小写，单词用中划线分隔。
5. 禁止在 Controller 层直接操作 Redis、数据库，必须通过 Service 层调用。

### 5.2 Service 层规范

1. 业务逻辑全部在 Service 层实现，复杂业务拆分为多个子方法，单个方法不超过 80 行。
2. 接口与实现分离，一个 Service 接口对应一个实现类；跨业务调用必须通过对方 Service 接口。
3. 事务注解 `@Transactional` 只加在需要事务的方法上，禁止加在类上；指定 rollbackFor = Exception.class。
4. 禁止在 Service 层获取 Request/Response 对象，参数通过方法入参传递。
5. 缓存逻辑写在 Service 层，遵循「先查缓存 → 缓存未命中查数据库 → 写入缓存」的标准流程。

### 5.3 DAO/Mapper 层规范

1. Mapper 接口只做数据库交互，禁止写入业务逻辑。
2. 单表简单操作可使用注解 SQL，多表关联、复杂查询必须写在 XML 中。
3. 分页查询统一使用 PageHelper 插件，禁止手动拼接 limit 语句。
4. 批量操作使用 foreach 标签，禁止循环单条插入/更新。
5. 禁止 Mapper 层直接抛出业务异常，只返回数据结果，异常由 Service 层处理。

### 5.4 实体对象规范

1. **PO**：与数据库表严格一一对应，字段名与表字段驼峰映射，禁止扩展业务字段。
2. **DTO**：前端入参专用，按接口场景定义，禁止与 PO 混用。
3. **VO**：返回前端专用，按需裁剪字段，敏感信息必须脱敏。
4. **BO**：Service 层内部传输使用，禁止传到 Controller 层。
5. 对象转换使用工具类（如 BeanUtils），禁止手动大量 set/get 赋值；复杂转换自定义 Convert 类。

------

## 六、PostgreSQL 数据库开发规范

### 6.1 表与字段命名规范

1. 表名：全小写，下划线分隔，按模块加前缀（系统表 

   ```
   sys_
   ```

   、业务表 

   ```
   biz_
   ```

   ）。

   - 正例：`sys_user`、`biz_order`
   - 反例：`User`、`sysUser`、`order_info_table`

2. 字段名：全小写，下划线分隔，禁止使用 PostgreSQL 关键字（如 user、order）。

3. 必备通用字段：所有表必须包含以下字段

```
id BIGSERIAL PRIMARY KEY,          -- 主键，自增
create_time TIMESTAMP NOT NULL DEFAULT NOW(), -- 创建时间
update_time TIMESTAMP NOT NULL DEFAULT NOW(), -- 更新时间
create_by BIGINT,                  -- 创建人
update_by BIGINT,                  -- 更新人
is_deleted SMALLINT NOT NULL DEFAULT 0 -- 逻辑删除：0未删除 1已删除
```

### 6.2 字段类型与Java映射规范

| PostgreSQL 类型    | Java 类型     | 适用场景         |
| ------------------ | ------------- | ---------------- |
| BIGSERIAL / BIGINT | Long          | 主键、大整数     |
| INTEGER            | Integer       | 状态、数量、类型 |
| SMALLINT           | Integer       | 枚举值、标记位   |
| VARCHAR(n)         | String        | 字符串、文本     |
| TEXT               | String        | 长文本、大字段   |
| DECIMAL(p,s)       | BigDecimal    | 金额、高精度数值 |
| TIMESTAMP          | LocalDateTime | 日期时间         |
| DATE               | LocalDate     | 日期             |
| BOOLEAN            | Boolean       | 布尔标记         |

### 6.3 索引与约束规范

1. 主键默认创建主键索引；唯一约束字段必须建唯一索引。
2. 索引命名：普通索引 `idx_表名_字段名`，唯一索引 `uk_表名_字段名`。
3. 禁止在低基数字段（如性别、状态）建索引；联合索引遵循最左前缀原则。
4. 大表新增索引必须在测试环境验证执行计划，禁止生产环境直接加索引。

### 6.4 SQL 编写规范

1. 禁止使用 `select *`，必须明确查询字段；插入语句必须指定字段名，禁止 `insert into table values(...)`。
2. 所有动态条件使用 MyBatis `<where>`、`<if>` 标签，禁止字符串拼接 SQL，防止注入。
3. 禁止使用存储过程、触发器；复杂计算放在 Java 代码中处理。
4. 大表查询必须加分页，禁止全表查询；禁止在循环中执行数据库操作。
5. 更新、删除语句必须加条件，禁止全表更新/删除。

------

## 七、Redis 使用规范（Jedis 2.9.0）

### 7.1 客户端与配置说明

- 采用 **Jedis 2.9.0** 作为 Redis 客户端，排除 Spring Boot 默认 Lettuce 客户端，配合 Spring Data Redis 封装操作。
- 连接池使用 JedisPool，配置最大连接数、最小空闲连接、连接超时，避免连接泄漏。

### 7.2 Key 命名规范

1. 格式：

   ```
   业务模块:功能:唯一标识
   ```

   ，全小写，下划线分隔，冒号分层。

   - 正例：`user:info:1001`、`order:list:user_1001`
   - 反例：`userInfo1001`、`USER:INFO`

2. 所有 Key 必须在 `RedisKeyConstant` 常量类中定义前缀，禁止硬编码散落在业务代码中。

3. Key 长度控制在 64 字符以内，避免过长占用内存。

### 7.3 数据类型使用规范

| 数据类型 | 适用场景                     | 禁止场景               |
| -------- | ---------------------------- | ---------------------- |
| String   | 单个对象缓存、计数、分布式锁 | 大对象（超过 100KB）   |
| Hash     | 对象字段频繁单独修改         | 字段过多（超过 50 个） |
| List     | 简单列表、队列               | 大量数据分页查询       |
| Set      | 去重、交集并集计算           | 有序列表场景           |
| ZSet     | 排行榜、有序队列             | 普通缓存场景           |

### 7.4 缓存操作规范

1. **必须设置过期时间**：所有业务缓存必须设置 TTL，根据业务场景设置；永久 Key 必须经过技术评审。
2. 缓存穿透：查询不存在的数据缓存空值，设置短过期时间。
3. 缓存击穿：热点 Key 失效加互斥锁，避免大量请求直击数据库。
4. 操作异常降级：Redis 操作异常时捕获异常，直接查询数据库，禁止抛出异常导致接口失败。
5. 禁止使用 `keys`、`flushdb`、`flushall` 等危险命令，生产环境禁用。
6. 序列化采用 Jackson2JsonRedisSerializer，禁止使用 JDK 原生序列化。

------

## 八、Log4j2 日志规范

### 8.1 日志级别与使用场景

| 级别  | 使用场景                                                   |
| ----- | ---------------------------------------------------------- |
| DEBUG | 开发调试信息，打印详细入参、中间变量，生产环境关闭         |
| INFO  | 核心业务流程节点、系统启动信息、关键状态变更               |
| WARN  | 不影响主流程的异常、重试、降级操作，需要关注但无需立即处理 |
| ERROR | 业务异常、系统错误、第三方调用失败，必须排查处理           |

### 8.2 日志打印行为规范

1. 禁止使用 `System.out`、`e.printStackTrace()` 输出日志，全部使用 Log4j2 API。

2. 日志必须打印上下文信息：请求ID、用户ID、业务标识，方便排查问题。

3. 异常日志必须打印完整堆栈信息，使用 `log.error("描述信息", e)`，禁止只打印异常消息。

4. 敏感信息（手机号、身份证、密码）必须脱敏后打印，禁止明文输出。

5. 禁止在循环中大量打印日志；大对象入参禁止全量打印，只打印关键字段。

6. 日志使用占位符 

   ```
   {}
   ```

    拼接，禁止字符串加号拼接，避免性能损耗。

   - 正例：`log.info("查询用户信息，userId:{}", userId);`
   - 反例：`log.info("查询用户信息，userId:" + userId);`

### 8.3 配置文件规范

1. 配置文件命名 `log4j2-spring.xml`，放在 resources 目录下，Spring Boot 自动加载。
2. 日志输出分两类：
   - 控制台输出：开发环境开启，彩色格式，方便调试。
   - 文件输出：按天滚动，按大小切割，保留 30 天日志；error 级别日志单独存文件。
3. 生产环境关闭 DEBUG 级别，只输出 INFO 及以上日志。

------

## 九、核心依赖与构建规范

### 9.1 pom.xml 核心依赖配置

对应你指定的版本参数，核心依赖配置如下：

```
<properties>
    <java.version>1.8</java.version>
    <tomcat.version>9.0.93</tomcat.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <log4j2.version>2.17.2</log4j2.version>
    <jedis.version>2.9.0</jedis.version>
    <mybatis.version>2.2.0</mybatis.version>
    <pagehelper.version>1.4.2</pagehelper.version>
</properties>

<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.4.2</version>
    <relativePath/>
</parent>

<dependencies>
    <!-- Web 启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- 排除默认 Logback -->
        <exclusions>
            <exclusion>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-logging</artifactId>
            </exclusion>
        </exclusions>
    </dependency>

    <!-- Log4j2 日志 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-log4j2</artifactId>
    </dependency>

    <!-- PostgreSQL 驱动 -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>${mybatis.version}</version>
    </dependency>

    <!-- 分页插件 -->
    <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper-spring-boot-starter</artifactId>
        <version>${pagehelper.version}</version>
    </dependency>

    <!-- Redis 启动器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
        <!-- 排除 Lettuce，使用 Jedis -->
        <exclusions>
            <exclusion>
                <groupId>io.lettuce</groupId>
                <artifactId>lettuce-core</artifactId>
            </exclusion>
        </exclusions>
    </dependency>

    <!-- Jedis 客户端 2.9.0 -->
    <dependency>
        <groupId>redis.clients</groupId>
        <artifactId>jedis</artifactId>
        <version>${jedis.version}</version>
    </dependency>

    <!-- 参数校验 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok 简化代码 -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### 9.2 构建与打包规范

1. 打包方式：默认打成 jar 包，使用内置 Tomcat 运行；如需外置 Tomcat，修改 packaging 为 war，排除内置 Tomcat。
2. 生产构建必须跳过单元测试：`mvn clean package -DskipTests`。
3. 打包产物命名：`项目名-环境-版本号.jar`，禁止使用默认名称。

**全局统一返回结果、自定义异常、全局异常处理器**的都需要按照阿里巴巴规范。