import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'tx/:hash',
        name: 'transaction',
        component: () => import('pages/TransactionDetail.vue')
      },
      {
        path: 'address/:address',
        name: 'address',
        component: () => import('pages/AddressDetail.vue')
      },
      {
        path: 'btc/tx/:txid',
        name: 'bitcoin-transaction',
        component: () => import('pages/BitcoinTransactionDetail.vue')
      },
      {
        path: 'btc/address/:address',
        name: 'bitcoin-address',
        component: () => import('pages/BitcoinAddressDetail.vue')
      }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
