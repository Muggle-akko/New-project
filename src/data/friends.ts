export interface FriendLink {
  name: string;
  description: string;
  note: string;
  url: string;
  avatarUrl?: string;
}

export const friendLinks: FriendLink[] = [
  // 新增友链时复制这一段，取消注释并改成真实信息即可。
  // {
  //   name: "朋友的网站名",
  //   description: "一句话介绍这个网站，建议控制在 20-60 字。",
  //   note: "你作为博主给 TA 的批注。",
  //   url: "https://example.com",
  //   avatarUrl: "https://example.com/avatar.png", // 可留空，页面会用站名生成文字头像。
  // },
   {
    name: "阿亓",
    description: "你好呀，我是阿亓。我打算在这里，写写关于我的东西。",
    note: "这是俊浩的个人网站，大家去看看这家伙",
    url: "https://qixiao.online",
    avatarUrl: "https://qixiao.online/images/site-bg.jpg",
  },
  {
    name: "钰de个人博客",
    description: "无用之用，方为大用，欢迎你们常来逛逛",
    note: "多多更新！",
    url: "https://ayublogisok.netlify.app",
    avatarUrl: "/images/yublog.png",
  },
];