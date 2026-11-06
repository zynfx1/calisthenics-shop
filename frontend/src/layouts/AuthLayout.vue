<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <div class="hidden flex-col justify-between bg-surface p-12 lg:flex">
      <RouterLink to="/" class="text-xl font-semibold tracking-tight">calishop</RouterLink>
      <p class="max-w-md text-5xl font-semibold leading-[1.05] tracking-tighter">
        Gear for the strength you already have.
      </p>
    </div>
    <div class="flex flex-col justify-center px-6 py-12 sm:px-12">
      <RouterLink to="/" class="mb-12 text-xl font-semibold tracking-tight lg:hidden">calishop</RouterLink>
      <div class="mx-auto w-full max-w-sm"><slot /></div>
    </div>
  </div>
</template>
