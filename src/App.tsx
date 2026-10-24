import { useEffect } from 'react'
import { initBuildBinder } from './lib/buildBinder'

export function App() {
  useEffect(() => {
    initBuildBinder()
  }, [])

  return (
    <>
      <div className="blueprint-grid" aria-hidden="true" />
      <a className="skip-link" href="#workspace">Skip to workspace</a>

      <header className="topbar">
        <button className="icon-button mobile-only" id="menuToggle" aria-label="Open binder navigation" title="Open navigation">
          <span /><span /><span />
        </button>
        <a className="brand" href="#dashboard" aria-label="The Build Binder home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img"><path d="M8 8h23l9 9v23H8z"/><path d="M31 8v10h9M15 22h18M15 29h18M15 36h11"/></svg>
          </span>
          <span><strong>THE BUILD BINDER</strong><small>VEHICLE RESTORATION SYSTEM</small></span>
        </a>

        <div className="topbar-project">
          <label htmlFor="projectSelect">ACTIVE PROJECT</label>
          <div className="select-wrap">
            <select id="projectSelect" aria-label="Active restoration project" />
          </div>
        </div>

        <div className="topbar-actions">
          <span className="save-state" id="saveState"><i /> Saved locally</span>
          <button className="button ghost" id="quickAddButton" title="Add an action, issue, part or work entry"><span aria-hidden="true">＋</span> Quick add</button>
          <button className="icon-button" id="commandButton" aria-label="Open command palette" title="Search binder (Ctrl/Command + K)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
          </button>
        </div>
      </header>

      <aside className="sidebar" id="sidebar" aria-label="Binder navigation">
        <div className="project-plaque">
          <span className="eyebrow">PROJECT FILE</span>
          <div className="project-image-frame" id="projectImageFrame">
            <img id="projectImagePreview" alt="" hidden />
            <div className="project-image-placeholder" id="projectImagePlaceholder" aria-hidden="true">
              <svg viewBox="0 0 120 54">
                <path d="M7 45h106M14 39l13-16h58l19 16M34 23l8-10h31l12 10M25 39h70M34 39a7 7 0 1 1-14 0M100 39a7 7 0 1 1-14 0"/>
              </svg>
              <span>PROJECT IMAGE / LOGO</span>
            </div>
          </div>
          <div className="project-image-controls">
            <label className="project-image-button" htmlFor="projectImageInput" id="projectImageActionLabel">＋ Add image</label>
            <input id="projectImageInput" type="file" accept="image/png,image/jpeg,image/webp" hidden />
            <button className="project-image-remove" id="projectImageRemove" type="button" hidden>Remove</button>
          </div>
          <strong id="plaqueName">Wild Plum XA</strong>
          <span id="plaqueVehicle">XA Coupe · details to verify</span>
          <div className="project-code"><span id="plaqueCode">WPXA-001</span><span id="plaqueVersion">v0.1</span></div>
        </div>

        <nav id="mainNav" />

        <div className="sidebar-footer">
          <button className="nav-utility" id="newProjectButton">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            New restoration
          </button>
          <button className="nav-utility" id="dataButton">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 4v6M17 4v6M5 12h14v8H5z"/></svg>
            Data &amp; backup
          </button>
          <button className="nav-utility" id="printButton">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-5h18v5a2 2 0 0 1-2 2h-2M7 15h10v6H7z"/></svg>
            Print preview
          </button>
        </div>
      </aside>

      <main id="workspace" className="workspace" tabIndex={-1}>
        <div className="workspace-inner" id="app" />
      </main>

      <div className="toast-region" id="toastRegion" aria-live="polite" aria-atomic="true" />

      <div className="modal-backdrop" id="modalBackdrop" hidden>
        <section className="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <header>
            <div><span className="eyebrow" id="modalKicker">BUILD BINDER</span><h2 id="modalTitle">Dialog</h2></div>
            <button className="icon-button" id="modalClose" aria-label="Close dialog">×</button>
          </header>
          <div className="modal-content" id="modalContent" />
          <footer id="modalFooter" />
        </section>
      </div>

      <template id="emptyStateTemplate">
        <div className="empty-state">
          <span className="drawing-symbol">＋</span>
          <h3>No records yet</h3>
          <p>Add the first record to begin this section.</p>
        </div>
      </template>
    </>
  )
}
