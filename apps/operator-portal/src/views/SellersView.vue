<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Seller {
  id: string
  companyName: string
  email: string
  siret: string
  createdAt: string
  kybStatus: string
}

const sellers = ref<Seller[]>([])

onMounted(async () => {
  const response = await fetch('http://localhost:3000/sellers')
  const data = await response.json()
  sellers.value = data
})
</script>

<template>
  <div class="sellers-view">
    <h1>Vendeurs</h1>
    <ul>
      <li v-for="seller in sellers" :key="seller.id">
        {{ seller.companyName }} — {{ seller.kybStatus }}
      </li>
    </ul>
  </div>
</template>
