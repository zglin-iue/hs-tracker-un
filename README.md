# HS-Tracker-UN

HS 版本映射工具：输入商品 HS Code 和一个或多个目标年份，返回 HS92–HS22 的代码路径，以及各目标年份对应的全部代码分支。

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

{"code":"010121","source_version":"AUTO","target_years":"2005 2010 2015 2020"}
```

返回 `versions`、`edges` 和 `target_results`。目标年份使用不晚于该年份的最近 HS 版本：2005→HS02、2010→HS07、2015→HS12、2020→HS17。来源版本默认为 `AUTO`，程序根据正权重关系和稀疏表中的隐式延续推断候选版本。转换关系优先使用本地 Harvard conversion weights；权重文件未列出的代码会以 `implicit_identity` 标记为隐式延续，不静默当作直接权重关系。

## 来源

- UN Statistics classification: <https://unstats.un.org/unsd/classifications/Econ>
- WTO HS Tracker: <https://hstracker.wto.org/>
- Harvard conversion weights: 由项目内 `data/conversion_weights` 提供。
