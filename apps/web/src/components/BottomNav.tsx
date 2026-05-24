'use client';

import Link from 'next/link';
import { IconList, IconScissors, IconSettings } from './icons';

type NavKey = 'services' | 'my-meetings' | 'settings';

interface BottomNavProps {
  active: NavKey;
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="figma-bottom-nav" aria-label="Navegação principal">
      <div className="figma-bottom-nav-inner" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <Link className={`figma-nav-btn ${active === 'services' ? 'active' : ''}`} href="/services">
          <IconScissors className="figma-nav-icon" />
          Serviços
        </Link>
        <Link
          className={`figma-nav-btn ${active === 'my-meetings' ? 'active' : ''}`}
          href="/my-meetings"
        >
          <IconList className="figma-nav-icon" />
          Agendamentos
        </Link>
        <Link className={`figma-nav-btn ${active === 'settings' ? 'active' : ''}`} href="/settings">
          <IconSettings className="figma-nav-icon" />
          Configurar
        </Link>
      </div>
    </nav>
  );
}
