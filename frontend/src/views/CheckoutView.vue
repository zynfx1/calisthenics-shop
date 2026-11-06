<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ordersApi, usersApi } from '@/api/endpoints';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { apiError, fieldErrors } from '@/utils/errors';
import { formatPrice } from '@/utils/format';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';

const router = useRouter();
const cart = useCartStore();
const toast = useToastStore();

const form = reactive({ recipientName: '', phone: '', shippingAddress: '' });
const errors = ref<Record<string, string>>({});
const formError = ref('');
const stockIssues = ref<string[]>([]);
const submitting = ref(false);
const ready = ref(false);

onMounted(async () => {
  try {
    const [, profile] = await Promise.all([cart.fetch(), usersApi.me()]);
    if (!cart.cart.items.length) return router.replace({ name: 'cart' });
    form.recipientName = profile.name;
    form.phone = profile.phone ?? '';
    form.shippingAddress = profile.address ?? '';
  } catch (e) {
    toast.push(apiError(e).message);
  } finally {
    ready.value = true;
  }
});

const blocked = computed(() => cart.hasUnavailable);

async function submit() {
  formError.value = '';
  stockIssues.value = [];
  errors.value = {};

  if (!form.recipientName.trim()) errors.value.recipientName = 'Enter the recipient’s name.';
  if (!form.phone.trim()) errors.value.phone = 'Enter a phone number for the courier.';
  if (!form.shippingAddress.trim()) errors.value.shippingAddress = 'Enter a delivery address.';
  if (Object.keys(errors.value).length) return;

  submitting.value = true;
  try {
    const order = await ordersApi.create({
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      shippingAddress: form.shippingAddress.trim(),
    });
    await cart.fetch().catch(() => {});
    toast.push('Order placed');
    router.replace({ name: 'order', params: { id: order.id } });
  } catch (e) {
    const err = apiError(e);
    errors.value = fieldErrors(err);

    if (err.code === 'INSUFFICIENT_STOCK' || err.code === 'PRODUCT_UNAVAILABLE') {
      // Name the affected products using the cart we already have, then refresh it.
      const names = new Map(cart.cart.items.map((i) => [i.productId, i.name]));
      stockIssues.value = (err.details ?? []).map((d) => {
        const name = names.get(d.productId) ?? d.name ?? 'An item';
        return d.available !== undefined ? `${name}: only ${d.available} left` : `${name}: no longer available`;
      });
      formError.value = err.message;
      await cart.fetch().catch(() => {});
    } else if (!Object.keys(errors.value).length) {
      formError.value = err.message;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="page-x py-10 sm:py-14">
    <h1 class="text-4xl font-semibold tracking-tighter sm:text-5xl">Checkout</h1>

    <div v-if="!ready" class="mt-10 grid gap-12 lg:grid-cols-[1fr_26rem]" aria-busy="true">
      <div class="h-96 animate-pulse rounded-tile bg-surface" />
      <div class="h-96 animate-pulse rounded-tile bg-surface" />
    </div>

    <div v-else class="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_26rem]">
      <form id="checkout-form" class="flex max-w-xl flex-col gap-5" @submit.prevent="submit">
        <h2 class="text-xl font-semibold tracking-tight">Delivery details</h2>
        <BaseInput v-model="form.recipientName" label="Recipient" autocomplete="name" :error="errors.recipientName" />
        <BaseInput v-model="form.phone" label="Phone" type="tel" autocomplete="tel" :error="errors.phone" />
        <BaseInput
          v-model="form.shippingAddress"
          label="Address"
          textarea
          :rows="3"
          autocomplete="street-address"
          :error="errors.shippingAddress"
        />

        <div class="rounded-2xl border border-line p-4 text-sm">
          <p class="font-medium">Cash on delivery</p>
          <p class="mt-1 text-muted">You pay the courier when your order arrives.</p>
        </div>

        <div v-if="formError" class="rounded-2xl border border-soft p-4 text-sm" role="alert">
          <p class="font-medium">{{ formError }}</p>
          <ul v-if="stockIssues.length" class="mt-2 list-disc space-y-1 pl-5 text-soft">
            <li v-for="issue in stockIssues" :key="issue">{{ issue }}</li>
          </ul>
          <RouterLink v-if="stockIssues.length" :to="{ name: 'cart' }" class="mt-3 inline-block underline underline-offset-4">
            Review your cart
          </RouterLink>
        </div>
      </form>

      <aside class="rounded-tile bg-paper p-6 text-void sm:p-8 lg:sticky lg:top-24">
        <h2 class="text-xl font-semibold tracking-tight">Your order</h2>
        <ul class="mt-6 space-y-3 text-sm">
          <li v-for="item in cart.cart.items" :key="item.productId" class="flex justify-between gap-4">
            <span class="min-w-0 truncate">{{ item.name }} <span class="text-void/50">× {{ item.quantity }}</span></span>
            <span class="tabular-nums">{{ formatPrice(item.lineTotal) }}</span>
          </li>
        </ul>
        <div class="mt-6 flex items-baseline justify-between border-t border-void/15 pt-6">
          <span class="font-medium">Total</span>
          <span class="text-3xl font-semibold tracking-tight tabular-nums">{{ formatPrice(cart.cart.subtotal) }}</span>
        </div>
        <BaseButton
          type="submit"
          form="checkout-form"
          variant="inverse"
          size="lg"
          block
          class="mt-8"
          :loading="submitting"
          :disabled="blocked"
        >
          Place order
        </BaseButton>
        <p v-if="blocked" class="mt-3 text-sm text-void/60">
          Some items are unavailable.
          <RouterLink :to="{ name: 'cart' }" class="underline underline-offset-4">Review cart</RouterLink>
        </p>
      </aside>
    </div>
  </div>
</template>
