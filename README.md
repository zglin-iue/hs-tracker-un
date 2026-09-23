# HS-Tracker-UN

HS 版本映射工具：输入一个或多个商品 HS Code 和目标年份，返回每个代码的 HS92–HS22 代码路径，以及各目标年份对应的全部代码分支。

## 启动

```bash
/opt/anaconda3/bin/python -m pip install -r requirements.txt
/opt/anaconda3/bin/python app.py
```

打开 <http://127.0.0.1:8010>。

转换权重默认读取项目内目录：

`data/conversion_weights`

## API

```http
POST /api/convert
Content-Type: application/json

{"codes":"010110 390760","source_version":"AUTO","target_years":"2005 2010 2015 2020"}
```

返回 `results`；每个代码结果包含 `versions`、`edges` 和 `target_results`。目标年份使用不晚于该年份的最近 HS 版本：2005→HS02、2010→HS07、2015→HS12、2020→HS17。来源版本默认为 `AUTO`，程序根据正权重关系和稀疏表中的隐式延续推断候选版本。转换关系优先使用本地 Harvard conversion weights；权重文件未列出的代码会以 `implicit_identity` 标记为隐式延续，不静默当作直接权重关系。

上传接口：

```http
POST /api/upload-hscodes
Content-Type: multipart/form-data
```

支持 `.csv` 和 `.xlsx`。上传文件必须包含列名 `HSCode`，程序从该列提取六位代码；不再自动猜测其他列。

导出接口：

```http
POST /api/export-excel
Content-Type: application/json

{"codes":"010110 390760","target_years":"2005 2010"}
```

单个目标年份返回对应的 `.xlsx` 文件；多个目标年份返回 ZIP，内部文件按 `年份_HS版本.xlsx` 命名。英文描述直接读取项目内 UNSD 官方完整 HS 描述表的对应版本。UNSD 官方跨版本描述文件不提供统一中文 HS 描述，且不同国家税则的中文名称不能替代目标版本，因此中文描述列暂时留空。

## 来源

- UN Statistics classification: <https://unstats.un.org/unsd/classifications/Econ>
- UNSD official HS codes and descriptions: <https://unstats.un.org/unsd/classifications/Econ/download/In%20Text/HSCodeandDescription.xlsx>
- WTO HS Tracker: <https://hstracker.wto.org/>
- Harvard conversion weights: 由项目内 `data/conversion_weights` 提供。
