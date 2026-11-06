<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usersApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { apiError, fieldErrors } from '@/utils/errors';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';

const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();

const loading = ref(true);
const email = ref('');
const profile = reactive({ name: '', phone: '', address: '' });
const profileErrors = ref<Record<string, string>>({});
const saving = ref(false);

const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' });
const pwErrors = ref<Record<string, string>>({});
const changing = ref(false);

onMounted(async () => {
  try {
    const me = await usersApi.me();
    email.value = me.email;
    profile.name = me.name;
    profile.phone = me.phone ?? '';
    profile.address = me.address ?? '';
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    loading.value = false;
  }
});

async function saveProfile() {
  profileErrors.value = {};
  if (!profile.name.trim()) {
    profileErrors.value.name = 'Name can’t be empty.';
    return;
  }
  saving.value = true;
  try {
    const updated = await usersApi.update({
      name: profile.name.trim(),
      phone: profile.phone.trim() || null,
      address: profile.address.trim() || null,
    });
    auth.setName(updated.name);
    toast.push('Profile saved');
  } catch (e) {
    const err = apiError(e);
    profileErrors.value = fieldErrors(err);
    if (!Object.keys(profileErrors.value).length) toast.push(err.message);
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  pwErrors.value = {};
  if (pw.newPassword.length < 8) pwErrors.value.newPassword = 'Use at least 8 characters.';
  if (pw.newPassword !== pw.confirm) pwErrors.value.confirm = 'Passwords don’t match.';
  if (Object.keys(pwErrors.value).length) return;

  changing.value = true;
  try {
    await usersApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
    // The server signs out every session after a password change.
    await auth.logout();
    toast.push('Password updated. Sign in again.');
    router.push({ name: 'login' });
  } catch (e) {
    const err = apiError(e);
    pwErrors.value = fieldErrors(err);
    if (err.code === 'INVALID_CREDENTIALS') pwErrors.value.currentPassword = 'That isn’t your current password.';
    else if (!Object.keys(pwErrors.value).length) toast.push(err.message);
  } finally {
    changing.value = false;
  }
}
</script>

<template>
  <div class="page-x py-10 sm:py-14">
    <h1 class="text-4xl font-semibold tracking-tighter sm:text-5xl">Profile</h1>

    <div v-if="loading" class="mt-10 h-72 max-w-xl animate-pulse rounded-tile bg-surface" aria-busy="true" />

    <div v-else class="mt-10 grid gap-16 lg:grid-cols-2">
      <form class="flex max-w-xl flex-col gap-5" @submit.prevent="saveProfile">
        <h2 class="text-xl font-semibold tracking-tight">Details</h2>
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-soft">Email</span>
          <p class="flex h-12 items-center rounded-xl border border-line px-4 text-muted">{{ email }}</p>
        </div>
        <BaseInput v-model="profile.name" label="Full name" autocomplete="name" :error="profileErrors.name" />
        <BaseInput v-model="profile.phone" label="Phone" type="tel" autocomplete="tel" :error="profileErrors.phone" />
        <BaseInput
          v-model="profile.address"
          label="Default delivery address"
          textarea
          autocomplete="street-address"
          hint="Used to prefill checkout."
          :error="profileErrors.address"
        />
        <BaseButton type="submit" class="self-start" :loading="saving">Save changes</BaseButton>
      </form>

      <form class="flex max-w-xl flex-col gap-5" @submit.prevent="changePassword">
        <h2 class="text-xl font-semibold tracking-tight">Password</h2>
        <BaseInput v-model="pw.currentPassword" label="Current password" type="password" autocomplete="current-password" :error="pwErrors.currentPassword" />
        <BaseInput v-model="pw.newPassword" label="New password" type="password" autocomplete="new-password" hint="At least 8 characters." :error="pwErrors.newPassword" />
        <BaseInput v-model="pw.confirm" label="Confirm new password" type="password" autocomplete="new-password" :error="pwErrors.confirm" />
        <BaseButton type="submit" variant="secondary" class="self-start" :loading="changing">Update password</BaseButton>
      </form>
    </div>
  </div>
</template>
