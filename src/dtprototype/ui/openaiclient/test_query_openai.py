# Copyright (c) 2024 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.
import unittest
from unittest import TestCase

from openai.types.chat import ChatCompletionMessage

from query_openai import query_openai, add_completion

# from CN104434809B
CN104434809B = """
奥拉帕尼，化学名称为4-[3-(4-环丙烷羧基-哌嗪-1-羧基)-4-氟-苄基]-2H-酚
嗪-1-酮，可用于提供聚-ADP-核糖聚合酶(PARP)抑制作用。这种作用可用于治疗癌症，如乳
腺癌或卵巢癌，其能够特别有效的治疗其细胞在同源重组(HR)依赖性DNA双键断裂(DSB)修
复通路中有缺陷的癌症，如BRCA1+和/或BRCA2+ve癌症。
"""


class Test(TestCase):

    @unittest.skip("sample by integration test")
    def test_query_openai(self):
        messages = [
            {
                "role": "user",
                "content": f'Translate to english: {CN104434809B}',
            }
        ]
        result: ChatCompletionMessage = query_openai(messages)
        print(add_completion(messages=messages, completion=result))


