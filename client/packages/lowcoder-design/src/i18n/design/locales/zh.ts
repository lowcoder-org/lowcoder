import {en} from "./en";

export const zh: typeof en = {
    ...en,
    addItem: "添加",
    duplicate: "复制",
    rename: "重命名",
    delete: "删除",
    edit: "编辑",
    ok: "确定",
    cancel: "取消",
    previousStep: "上一步",
    nextStep: "下一步",
    finish: "完成",
    country: {
        ...en.country,
        china: "中国",
    },
    notification: {
        ...en.notification,
        copySuccess: "复制成功",
        copyFail: "复制失败",
    },
    prop: {
        ...en.prop,
        basic: "基础",
        resources: "资源",
        interaction: "交互",
        advanced: "高级",
        validation: "验证",
        layout: "布局",
        labelStyle:"标签样式",
        style: "样式",
        meetings: "会议",
        data: "数据",
    },
    passwordInput: {
        ...en.passwordInput,
        label: "密码:",
        placeholder: "请输入密码",
        inconsistentPassword: "两次密码输入不一致",
        confirmPasswordLabel: "确认密码:",
        confirmPasswordPlaceholder: "请再次输入密码",
    },
    verifyCodeInput: {
        ...en.verifyCodeInput,
        label: "验证码:",
        errorMsg: "验证码应为 {digitNum} 位数字",
        placeholder: "请输入 {digitNum} 位数字验证码",
        sendCode: "发送验证码",
    },
    iconSelect: {
        ...en.iconSelect,
        title: "选择图标",
        searchPlaceholder: "搜索图标",
    },
    eventHandler: {
        ...en.eventHandler,
        advanced: "高级",
    },
    comp: {
        ...en.comp,
        selectedCompsTitle: "已选择 {selectCompNum} 个组件",
        selectedCompsDetail: "点击组件查看其属性",
        batchDelete: "批量删除",
    },
    optionsControl: {
        ...en.optionsControl,
        optionItemErrorMSg: `发现重复的选项值 "{value}"，只会显示第一项,请更改为唯一值.`,
        emptyList: "无选项",
    },
    container: {
        ...en.container,
        hintPlaceHolder: "从右侧面板拖动组件",
    },
  };
  
