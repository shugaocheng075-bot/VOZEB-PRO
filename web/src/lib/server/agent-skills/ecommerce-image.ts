export const ECOMMERCE_IMAGE_SKILL = {
    id: "ecommerce-image",
    name: "电商生图",
    description: "为商品主图、场景图和详情页生成清晰、可售卖的商业视觉。",
    plannerSummary: "用户要做电商主图、场景图、详情页或社媒商品图时使用；规划一张最匹配的商品画面，保持外观一致。",
    sourceUrl: "https://github.com/buluslan/gpt-image2-ecommerce",
    sourceVersion: "0.1.0",
    license: "MIT",
    enabled: true,
    workspaces: ["image", "canvas"],
    action: "generate",
    requiresReference: false,
    defaultConfig: { quality: "high", count: 1 },
    keywords: ["电商", "商品", "主图", "详情页", "淘宝", "天猫", "京东", "拼多多", "抖音商城", "Amazon", "Shopify", "Etsy", "TikTok Shop", "小红书", "UGC", "包装", "模特"],
    instructions: `用 VOZEB PRO 已配置的图片模型生成一张最匹配的商品图，不要拆成多场景目录或输出模板名。
提示词只写可见画面：商品主体、材质、颜色、Logo、包装、构图、镜头、光线、背景和画幅。
主图优先干净背景、主体完整、卖点可读；场景图写清使用环境和人物关系；详情页突出局部材质或尺寸信息。
有参考图时锁定商品轮廓、颜色、材质和 Logo，不得改结构、换款或重造包装。
避免塑料感、变形、杂乱道具、错误文字和与平台无关的装饰。`,
} as const;
