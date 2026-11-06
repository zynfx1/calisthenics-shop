<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { apiError, fieldErrors } from '@/utils/errors';
import AuthLayout from '@/layouts/AuthLayout.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const errors = ref<Record<string, string>>({});
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  errors.value = {};
  if (form.password.length < 8) errors.value.password = 'Use at least 8 characters.';
  if (form.password !== form.confirm) errors.value.confirm = 'Passwords don’t match.';
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  try {
    await auth.register(form.name.trim(), form.email.trim(), form.password);
    const redirect = route.query.redirect;
    const safe = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//');
    router.replace(safe ? redirect : { name: 'home' });
  } catch (e) {
    const err = apiError(e);
    errors.value = fieldErrors(err);
    if (err.code === 'EMAIL_TAKEN') errors.value.email = 'That email already has an account. Sign in instead.';
    else if (!Object.keys(errors.value).length) error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-4xl font-semibold tracking-tight">Create account</h1>
    <p class="mt-2 text-muted">Save your cart and track your orders.</p>

    <form class="mt-10 flex flex-col gap-5" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Full name" autocomplete="name" required :error="errors.name" />
      <BaseInput v-model="form.email" label="Email" type="email" autocomplete="email" required :error="errors.email" />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="At least 8 characters."
        required
        :error="errors.password"
      />
      <BaseInput
        v-model="form.confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        required
        :error="errors.confirm"
      />
      <p v-if="error" class="text-sm text-paper" role="alert">{{ error }}</p>
      <BaseButton type="submit" size="lg" block :loading="loading">Create account</BaseButton>
    </form>

    <p class="mt-8 text-sm text-muted">
      Already have an account?
      <RouterLink :to="{ name: 'login', query: route.query }" class="text-paper underline underline-offset-4">
        Sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>
