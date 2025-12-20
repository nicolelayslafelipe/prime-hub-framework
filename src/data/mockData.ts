// DeliveryOS Extended Mock Data

import { Client, Banner, PaymentMethod, Review, MessageTemplate, User, LoyaltyProgram, ApiIntegration } from '@/types';

export const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-0001',
    totalOrders: 15,
    totalSpent: 450.80,
    lastOrderDate: new Date(Date.now() - 86400000),
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000),
    addresses: [
      {
        id: 'a1',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        zipCode: '01234-567',
        isDefault: true,
      }
    ]
  },
  {
    id: 'c2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 99999-0002',
    totalOrders: 8,
    totalSpent: 289.90,
    lastOrderDate: new Date(Date.now() - 172800000),
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000),
    addresses: [
      {
        id: 'a2',
        street: 'Av. Brasil',
        number: '456',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        zipCode: '01456-789',
        isDefault: true,
      }
    ]
  },
  {
    id: 'c3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '(11) 99999-0003',
    totalOrders: 23,
    totalSpent: 892.50,
    lastOrderDate: new Date(Date.now() - 43200000),
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 86400000),
    addresses: [
      {
        id: 'a3',
        street: 'Rua Augusta',
        number: '789',
        complement: 'Casa 2',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        zipCode: '01234-890',
        isDefault: true,
      }
    ]
  },
  {
    id: 'c4',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 99999-0004',
    totalOrders: 5,
    totalSpent: 156.70,
    status: 'blocked',
    createdAt: new Date(Date.now() - 60 * 86400000),
    addresses: []
  },
  {
    id: 'c5',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    phone: '(11) 99999-0005',
    totalOrders: 42,
    totalSpent: 1567.80,
    lastOrderDate: new Date(Date.now() - 3600000),
    status: 'active',
    createdAt: new Date(Date.now() - 180 * 86400000),
    addresses: [
      {
        id: 'a5',
        street: 'Rua Oscar Freire',
        number: '1001',
        neighborhood: 'Pinheiros',
        city: 'São Paulo',
        zipCode: '05409-010',
        isDefault: true,
      }
    ]
  }
];

export const mockBanners: Banner[] = [
  {
    id: 'bn1',
    title: 'Promoção de Inauguração',
    description: '20% de desconto em todos os burgers',
    imageUrl: '/placeholder.svg',
    isActive: true,
    order: 1,
    createdAt: new Date()
  },
  {
    id: 'bn2',
    title: 'Combo Família',
    description: 'Pizza + Bebidas + Sobremesa por apenas R$ 89,90',
    imageUrl: '/placeholder.svg',
    isActive: true,
    order: 2,
    createdAt: new Date()
  },
  {
    id: 'bn3',
    title: 'Frete Grátis',
    description: 'Pedidos acima de R$ 50 tem frete grátis',
    imageUrl: '/placeholder.svg',
    isActive: false,
    order: 3,
    createdAt: new Date()
  }
];

export const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm1', name: 'PIX', type: 'pix', isActive: true, icon: '💠' },
  { id: 'pm2', name: 'Cartão de Crédito', type: 'card', isActive: true, icon: '💳' },
  { id: 'pm3', name: 'Cartão de Débito', type: 'card', isActive: true, icon: '💳' },
  { id: 'pm4', name: 'Dinheiro', type: 'cash', isActive: true, icon: '💵', maxChange: 200 },
  { id: 'pm5', name: 'Vale Refeição', type: 'voucher', isActive: false, icon: '🎫' },
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    clientId: 'c1',
    clientName: 'João Silva',
    orderId: 'o1',
    rating: 5,
    comment: 'Excelente comida! Chegou quentinho e super saboroso.',
    isPublic: true,
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'r2',
    clientId: 'c2',
    clientName: 'Maria Santos',
    orderId: 'o2',
    rating: 4,
    comment: 'Muito bom, apenas demorou um pouco mais que o previsto.',
    response: 'Obrigado pelo feedback! Estamos trabalhando para melhorar nossos tempos de entrega.',
    isPublic: true,
    createdAt: new Date(Date.now() - 172800000)
  },
  {
    id: 'r3',
    clientId: 'c3',
    clientName: 'Pedro Oliveira',
    orderId: 'o3',
    rating: 5,
    comment: 'Melhor burger da região! Parabéns pela qualidade.',
    isPublic: true,
    createdAt: new Date(Date.now() - 259200000)
  },
  {
    id: 'r4',
    clientId: 'c5',
    clientName: 'Carlos Ferreira',
    orderId: 'o4',
    rating: 3,
    comment: 'Comida boa mas a embalagem veio danificada.',
    isPublic: false,
    createdAt: new Date(Date.now() - 345600000)
  }
];

export const mockMessageTemplates: MessageTemplate[] = [
  {
    id: 'mt1',
    name: 'Pedido Confirmado',
    type: 'order_confirmed',
    content: 'Olá {nome}! Seu pedido #{numero} foi confirmado e está sendo preparado. Tempo estimado: {tempo} minutos.',
    variables: ['nome', 'numero', 'tempo']
  },
  {
    id: 'mt2',
    name: 'Pedido em Preparo',
    type: 'order_preparing',
    content: 'Oi {nome}! Seu pedido #{numero} já está sendo preparado com todo carinho! 🍔',
    variables: ['nome', 'numero']
  },
  {
    id: 'mt3',
    name: 'Pedido Pronto',
    type: 'order_ready',
    content: '{nome}, seu pedido #{numero} está prontinho! Em breve sairá para entrega.',
    variables: ['nome', 'numero']
  },
  {
    id: 'mt4',
    name: 'Saiu para Entrega',
    type: 'order_out_for_delivery',
    content: 'Boa notícia {nome}! Seu pedido #{numero} saiu para entrega. Nosso motoboy {motoboy} está a caminho! 🏍️',
    variables: ['nome', 'numero', 'motoboy']
  },
  {
    id: 'mt5',
    name: 'Pedido Entregue',
    type: 'order_delivered',
    content: '{nome}, seu pedido #{numero} foi entregue! Obrigado pela preferência. Avalie sua experiência! ⭐',
    variables: ['nome', 'numero']
  },
  {
    id: 'mt6',
    name: 'PIX Recebido',
    type: 'pix_received',
    content: 'Pagamento PIX de R$ {valor} confirmado para o pedido #{numero}. Obrigado {nome}! ✅',
    variables: ['nome', 'numero', 'valor']
  }
];

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Admin Principal',
    email: 'admin@deliveryos.com',
    phone: '(11) 99999-0000',
    role: 'admin',
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 86400000),
    lastAccess: new Date()
  },
  {
    id: 'u2',
    name: 'Chef Roberto',
    email: 'cozinha@deliveryos.com',
    phone: '(11) 99999-1111',
    role: 'kitchen',
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 86400000),
    lastAccess: new Date(Date.now() - 3600000)
  },
  {
    id: 'u3',
    name: 'Marcos Motoboy',
    email: 'motoboy1@deliveryos.com',
    phone: '(11) 99999-2222',
    role: 'motoboy',
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 86400000),
    lastAccess: new Date(Date.now() - 7200000)
  },
  {
    id: 'u4',
    name: 'Lucas Entregador',
    email: 'motoboy2@deliveryos.com',
    phone: '(11) 99999-3333',
    role: 'motoboy',
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 86400000),
    lastAccess: new Date(Date.now() - 86400000 * 7)
  }
];

export const mockLoyaltyProgram: LoyaltyProgram = {
  isActive: false,
  pointsPerReal: 10,
  minimumRedemption: 100,
  rewards: [
    { id: 'lr1', name: 'Refrigerante Grátis', pointsCost: 50, description: 'Refrigerante 350ml grátis', isActive: true },
    { id: 'lr2', name: 'Sobremesa Grátis', pointsCost: 100, description: 'Brownie ou Petit Gateau', isActive: true },
    { id: 'lr3', name: 'Combo Individual', pointsCost: 200, description: 'Combo completo grátis', isActive: true },
    { id: 'lr4', name: '10% de Desconto', pointsCost: 150, description: '10% off no pedido', isActive: false }
  ]
};

export const mockApiIntegrations: ApiIntegration[] = [
  {
    id: 'api1',
    name: 'Mercado Pago',
    isActive: false,
    environment: 'test',
    publicKey: '',
    privateKey: '',
    status: 'disconnected'
  },
  {
    id: 'api2',
    name: 'WhatsApp Business',
    isActive: false,
    environment: 'production',
    status: 'disconnected'
  },
  {
    id: 'api3',
    name: 'Google Maps',
    isActive: true,
    environment: 'production',
    status: 'connected',
    lastCheck: new Date()
  }
];
