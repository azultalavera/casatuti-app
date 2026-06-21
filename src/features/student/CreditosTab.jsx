export default function CreditosTab({
  activePacks,
  selectedPackId,
  setSelectedPackId,
  selectedPack,
  buyStep,
  setBuyStep,
  buyLoading,
  onBuy,
  isModal = false,
}) {
  return (
    <div>
      {!isModal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '18px' }}>
            {buyStep === 1 ? 'Comprar créditos' : 'Realizar transferencia'}
          </h3>
        </div>
      )}

      {buyStep === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--gris-medio)', margin: 0 }}>Elegí tu pack de clases:</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activePacks.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--gris-medio)' }}>No hay paquetes disponibles en este momento.</p>
            )}
            {activePacks.map(pack => (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? 'var(--bg-crema)' : 'var(--blanco)',
                  boxShadow: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? '0 0 0 2px var(--marron-arcilla)' : '0 4px 16px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>
                    {pack.name} ({pack.credits} clases)
                  </span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>
                  ${pack.price.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={onBuy}
              disabled={buyLoading || !selectedPack}
              className="btn-tuti btn-primary-clay"
              style={{ flex: 1 }}
            >
              {buyLoading ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-crema)', padding: '24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '4px' }}>Total a transferir:</p>
            <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--marron-arcilla)', margin: 0 }}>
              ${selectedPack?.price.toLocaleString('es-AR')}
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--blanco)', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>Datos bancarios:</strong></p>
            <p style={{ fontSize: '13px', marginBottom: '8px' }}>
              CBU: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>000003100076164884013</code>
            </p>
            <p style={{ fontSize: '13px', marginBottom: '8px' }}>
              Alias: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>CASA.TUTI</code>
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>Titular: Maria Candelaria Luna Ottonello</p>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: '4px 0', textAlign: 'center' }}>
            Enviá el comprobante por WhatsApp para acreditar tus clases.
          </p>

          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="https://wa.me/5493517371575?text=Hola,%20acabo%20de%20realizar%20una%20transferencia%20para%20comprar%20clases."
              target="_blank"
              rel="noreferrer"
              className="btn-tuti"
              style={{ backgroundColor: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none' }}
            >
              Enviar comprobante por WhatsApp
            </a>
            <button onClick={() => setBuyStep(1)} className="btn-tuti btn-secondary">
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
