'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconCreditCard, IconEdit, IconX } from '@/components/icons';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createSale,
  Product,
} from '@/lib/api';
import { getProfileSnapshot, subscribeProfile } from '@/lib/profile';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ProductsPage() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  const isBarber = profile?.role === 'BARBER';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit/create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [priceReais, setPriceReais] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  // Sell modal
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [selling, setSelling] = useState(false);

  const isEditMode = editingId !== null;

  useEffect(() => {
    if (!hydrated) return;

    if (!profile) {
      router.replace('/login?next=/settings/products');
      return;
    }
    if (!isBarber) {
      router.replace('/services');
      return;
    }

    async function load() {
      try {
        setProducts(await fetchProducts());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [hydrated, profile, isBarber, router]);

  function openCreateModal() {
    setEditingId(null);
    setName('');
    setPriceReais('');
    setQuantity('');
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setPriceReais((product.priceCents / 100).toFixed(2).replace('.', ','));
    setQuantity(String(product.quantity));
    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit() {
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome do produto.');
      return;
    }

    const priceCents = Math.round(parseFloat(priceReais.replace(',', '.')) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError('Informe um preço válido.');
      return;
    }

    const quantityValue = parseInt(quantity, 10);
    if (!Number.isFinite(quantityValue) || quantityValue < 0) {
      setError('Informe uma quantidade válida.');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        const updated = await updateProduct(editingId, {
          name: trimmedName,
          priceCents,
          quantity: quantityValue,
        });
        setProducts((prev) =>
          prev
            .map((p) => (p.id === updated.id ? updated : p))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        const created = await createProduct({
          name: trimmedName,
          priceCents,
          quantity: quantityValue,
        });
        setProducts((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    setSaving(true);
    setError('');
    try {
      await deleteProduct(editingId);
      setProducts((prev) => prev.filter((p) => p.id !== editingId));
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir produto.');
    } finally {
      setSaving(false);
    }
  }

  function openSellModal(product: Product) {
    setSellingProduct(product);
    setSellQuantity(1);
    setError('');
  }

  function closeSellModal() {
    setSellingProduct(null);
    setError('');
  }

  async function handleSell() {
    if (!sellingProduct) return;

    setSelling(true);
    setError('');
    try {
      await createSale(sellingProduct.id, { quantity: sellQuantity });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === sellingProduct.id
            ? { ...p, quantity: p.quantity - sellQuantity }
            : p,
        ),
      );
      closeSellModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar venda.');
    } finally {
      setSelling(false);
    }
  }

  if (!profile || !isBarber) return null;

  return (
    <main className="figma-screen">
      <section className="scheduling-main">
        <header className="scheduling-header">
          <button className="left icon-btn" onClick={() => router.back()}>
            <IconArrowLeft />
          </button>
          <h1 className="scheduling-title">Produtos</h1>
        </header>

        <section className="services-list" style={{ marginTop: '16px' }}>
          <button className="primary-btn" onClick={openCreateModal}>
            Adicionar produto
          </button>

          {loading ? (
            <p className="helper-text">Carregando produtos...</p>
          ) : (
            products.map((product) => (
              <article className="service-card" key={product.id}>
                <button
                  className="icon-btn"
                  style={{ position: 'absolute', top: '8px', right: '8px', color: '#757575' }}
                  onClick={() => openEditModal(product)}
                  aria-label="Editar produto"
                >
                  <IconEdit className="icon-20" />
                </button>

                <p className="service-name">{product.name}</p>

                <div className="service-meta-row">
                  <IconCreditCard className="service-meta-icon icon-16" />
                  <span>{formatBRL(product.priceCents)}</span>
                </div>

                <p className="helper-text" style={{ fontSize: '14px' }}>
                  {product.quantity > 0
                    ? `${product.quantity} em estoque`
                    : 'Esgotado'}
                </p>

                <button
                  className="reserve-chip"
                  type="button"
                  disabled={product.quantity === 0}
                  style={product.quantity === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  onClick={() => openSellModal(product)}
                >
                  <IconCreditCard className="service-meta-icon icon-14" />
                  {product.quantity === 0 ? 'Esgotado' : 'Vender'}
                </button>
              </article>
            ))
          )}

          {!loading && products.length === 0 && (
            <p className="helper-text" style={{ textAlign: 'center', marginTop: '32px' }}>
              Nenhum produto cadastrado.
            </p>
          )}

          {error && !isModalOpen && !sellingProduct && (
            <p className="error-text">{error}</p>
          )}
        </section>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">{isEditMode ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="icon-btn" onClick={closeModal}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label className="helper-text">Nome do Produto</label>
                <input
                  type="text"
                  className="login-input"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pomada modeladora"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="helper-text">Valor (R$)</label>
                  <input
                    type="text"
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={priceReais}
                    onChange={(e) => setPriceReais(e.target.value)}
                    placeholder="25,00"
                  />
                </div>
                <div>
                  <label className="helper-text">Estoque</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="login-input"
                    style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button
                className="primary-btn"
                style={{ marginTop: '8px' }}
                disabled={saving || !name}
                onClick={() => void handleSubmit()}
              >
                {saving
                  ? isEditMode
                    ? 'Salvando...'
                    : 'Criando...'
                  : isEditMode
                    ? 'Salvar Alterações'
                    : 'Criar Produto'}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: '#ff2e2e', color: '#ffffff' }}
                  disabled={saving}
                  onClick={() => void handleDelete()}
                >
                  Excluir Produto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {sellingProduct && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-title-row">
              <h2 className="modal-title">Vender produto</h2>
              <button className="icon-btn" onClick={closeSellModal}>
                <IconX />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <p className="service-name">{sellingProduct.name}</p>
                <p className="helper-text" style={{ fontSize: '14px' }}>
                  {formatBRL(sellingProduct.priceCents)} • {sellingProduct.quantity} em estoque
                </p>
              </div>

              <div>
                <label className="helper-text">Quantidade</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={sellingProduct.quantity}
                  className="login-input"
                  style={{ width: '100%', height: '40px', border: '1px solid #dedede' }}
                  value={sellQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 1;
                    setSellQuantity(
                      Math.min(Math.max(1, value), sellingProduct.quantity),
                    );
                  }}
                />
              </div>

              <p className="helper-text" style={{ fontSize: '14px' }}>
                Total: {formatBRL(sellingProduct.priceCents * sellQuantity)}
              </p>

              {error && <p className="error-text">{error}</p>}

              <button
                className="primary-btn"
                style={{ marginTop: '8px' }}
                disabled={selling || sellQuantity < 1}
                onClick={() => void handleSell()}
              >
                {selling ? 'Registrando...' : 'Registrar venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
