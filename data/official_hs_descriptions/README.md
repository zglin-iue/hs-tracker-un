# 官方 HS 描述数据

## 英文描述

`HSCodeandDescription.xlsx` 下载自联合国统计司（UNSD）经济统计分类页面的 “All HS codes and descriptions” 文件，包含 HS92、HS96、HS02、HS07、HS12、HS17、HS22 七个工作表。程序只读取对应版本中六位代码的 `Description` 字段。

来源：<https://unstats.un.org/unsd/classifications/Econ/download/In%20Text/HSCodeandDescription.xlsx>

## 中文描述

UNSD 官方跨版本文件不提供统一中文 HS 描述。不同国家的中文税则名称具有本国税则语境，也不能通过 HS 版本转换关系替代目标版本描述。因此程序不会翻译、猜测或把旧版本代码映射到 HS22 再查找中文名称，导出文件的中文描述列暂时留空。
