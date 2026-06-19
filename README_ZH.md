# iciba-chrome

iCIBA Chrome 扩展。

[English](./README.md) | 中文

![](./app.png)

## 安装

[Chrome](https://chrome.google.com/webstore/detail/iciba/eknklfmpancpjepiepnopoedekiifklh)

[Edge](https://microsoftedge.microsoft.com/addons/detail/iciba/oigpeonhjfeabejhmingbagjpadnjmhc)

## 开发与打包

### 环境要求

- Node.js `24.17.0`
- pnpm `11.8.0`
- 项目依赖中的 Vite Plus CLI（`vp`）

```sh
$ git clone https://github.com/TaipaXu/iciba-chrome.git
$ cd iciba-chrome
$ pnpm i
```

### 常用脚本

```sh
# 构建一次，Chrome 扩展产物会输出到 dist/。
$ pnpm run build

# 以 watch 模式构建，用于扩展开发。
$ pnpm run dev

# 运行类型检查、oxlint 和 Vue 模板 lint。
$ pnpm run lint

# 使用 Vite Plus oxfmt 和 ESLint 模板规则格式化。
$ pnpm run format
```

构建完成后，在 Chrome 或 Edge 中以未打包扩展加载 `dist` 目录。

## 协议

[GPL-3.0](LICENSE)
