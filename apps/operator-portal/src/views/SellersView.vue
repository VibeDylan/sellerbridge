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
const updatingSellerId = ref<string | null>(null)

async function fetchSellers() {
  const response = await fetch('http://localhost:3000/sellers')
  sellers.value = await response.json()
}

async function reviewSeller(seller: Seller, status: 'approved' | 'rejected') {
  updatingSellerId.value = seller.id
  try {
    await fetch(`http://localhost:3002/kyb/by-seller/${seller.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    seller.kybStatus = status
  } finally {
    updatingSellerId.value = null
  }
}

onMounted(fetchSellers)
</script>

<template>
  <div class="sellers-view">
    <h1>Vendeurs</h1>
    <ul class="sellers-list">
      <li v-for="seller in sellers" :key="seller.id" class="seller-card">
        <div class="seller-info">
          <span class="company-name">{{ seller.companyName }}</span>
          <span class="status-badge" :class="`status-${seller.kybStatus}`">
            {{ seller.kybStatus }}
          </span>
        </div>
        <div class="seller-actions">
          <button
            v-if="seller.kybStatus === 'approved'"
            class="btn btn-suspend"
            :disabled="updatingSellerId === seller.id"
            @click="reviewSeller(seller, 'rejected')"
          >
            Suspendre
          </button>
          <button
            v-else
            class="btn btn-approve"
            :disabled="updatingSellerId === seller.id"
            @click="reviewSeller(seller, 'approved')"
          >
            Approuver
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sellers-view {
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

h1 {
  margin-bottom: 1.5rem;
}

.sellers-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seller-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.company-name {
  font-weight: 600;
}

.status-badge {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: #059669;
  color: white;
}

.btn-suspend {
  background: #dc2626;
  color: white;
}
</style>
