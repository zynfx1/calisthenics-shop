<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiError } from '@/utils/errors';
import AuthLayout from '@/layouts/AuthLayout.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const error = ref('');
const loading = ref(false);

// Only follow in-app redirects.
const safeRedirect = (raw: unknown) =>
  typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : undefined;

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    const user = await auth.login(form.email.trim(), form.password);
    const redirect = safeRedirect(route.query.redirect);
    if (user.role === 'ADMIN') {
      router.replace(redirect?.startsWith('/admin') ? redirect : { name: 'admin-products' });
    } else {
      router.replace(redirect ?? { name: 'home' });
    }
  } catch (e) {
    error.value = apiError(e).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-4xl font-semibold tracking-tight">Sign in</h1>
    <p class="mt-2 text-muted">Welcome back. Pick up where you left off.</p>

    <form class="mt-10 flex flex-col gap-5" @submit.prevent="submit">
      <BaseInput v-model="form.email" label="Email" type="email" autocomplete="email" required />
      <BaseInput v-model="form.password" label="Password" type="password" autocomplete="current-password" required />
      <p v-if="error" class="text-sm text-paper" role="alert">{{ error }}</p>
      <BaseButton type="submit" size="lg" block :loading="loading">Sign in</BaseButton>
    </form>

    <p class="mt-8 text-sm text-muted">
      New here?
      <RouterLink :to="{ name: 'register', query: route.query }" class="text-paper underline underline-offset-4">
        Create an account
      </RouterLink>
    </p>
  </AuthLayout>
</template>
