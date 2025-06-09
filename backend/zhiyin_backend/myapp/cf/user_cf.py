# 基于用户的协同过滤推荐算法
# 算法参考：https://blog.csdn.net/net19880504/article/details/137772131

import math
from typing import Dict, List, Tuple, Optional


class UserCf:
    """基于用户的协同过滤推荐系统（使用字符串user_id）"""

    def __init__(self, data: Dict[str, Dict[str, float]]):
        """
        初始化推荐系统
        :param data: 用户-物品评分数据，格式为 {user_id: {物品名: 评分}}
        """
        self.data = data

    def pearson(self, user1: Dict[str, float], user2: Dict[str, float]) -> Optional[float]:
        """
        计算两个用户的皮尔逊相关系数（保持不变）
        """
        common_items = set(user1.keys()) & set(user2.keys())
        n = len(common_items)
        if n == 0:
            return None
        sum_x = sum_y = sum_xy = sum_x2 = sum_y2 = 0.0
        try:
            for item in common_items:
                score1 = user1[item]
                score2 = user2[item]

                sum_x += score1
                sum_y += score2
                sum_xy += score1 * score2
                sum_x2 += score1 ** 2
                sum_y2 += score2 ** 2
            numerator = sum_xy - (sum_x * sum_y) / n
            denominator_x = math.sqrt(max(0, sum_x2 - (sum_x ** 2) / n))
            denominator_y = math.sqrt(max(0, sum_y2 - (sum_y ** 2) / n))
            if denominator_x * denominator_y == 0:
                return 0.0
            return numerator / (denominator_x * denominator_y)
        except Exception as e:
            print(f"计算皮尔逊相关系数时出错: {str(e)}")
            return None

    def nearest_users(self, user_id: str, n: int = 1) -> List[Tuple[str, float]]:
        """
        找到与指定用户最相似的n个用户
        :param user_id: 目标用户ID（字符串）
        :param n: 要返回的相似用户数量
        :return: 包含(user_id, 相似度)元组的列表
        """
        if user_id not in self.data:
            raise ValueError(f"用户ID {user_id} 不存在于数据集中")

        similarities = {}
        target_user = self.data[user_id]
        for other_user, items in self.data.items():
            if other_user == user_id:
                continue

            sim = self.pearson(target_user, items)
            if sim is not None:
                similarities[other_user] = sim
        print(f"用户 {user_id} 的相似用户及相似度: {similarities}")
        return sorted(similarities.items(), key=lambda x: abs(x[1]), reverse=True)[:n]

    def recommend(self, user_id: str, n_neighbors: int = 1) -> List[str]:
        """
        为指定用户生成推荐物品列表
        :param user_id: 目标用户ID（字符串）
        :param n_neighbors: 用于推荐的相似用户数量
        :return: 推荐物品ID列表
        """
        if user_id not in self.data:
            raise ValueError(f"用户ID {user_id} 不存在于数据集中")
        recommendations = set()
        target_items = self.data[user_id].keys()
        for neighbor, _ in self.nearest_users(user_id, n_neighbors):
            for item in self.data[neighbor]:
                if item not in target_items:
                    recommendations.add(item)
                    print(f"从相似用户 {neighbor} 推荐物品: {item}")

        return list(recommendations)
