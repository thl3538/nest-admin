<template>
    <el-config-provider :locale="locale" :button="button">
        <RouterView />
    </el-config-provider>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
/** 将 Element Plus 的语言设置为中文 */
const locale = ref(zhCn)
const button = reactive({ autoInsertSpace: true })
</script>
