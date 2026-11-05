// Icone disegnate per ProfClick: griglia 24, tratto 1.75 con estremi arrotondati, più un
// riempimento tenue nel colore del testo che dà corpo alla forma principale. Usano
// currentColor e prendono il colore di dove stanno. Niente emoji nell'interfaccia.

import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>
export type IconComponent = (props: IconProps) => React.JSX.Element

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const tint = { fill: 'currentColor', fillOpacity: 0.16, stroke: 'none' } as const

// --- Attività ---------------------------------------------------------------------------

/** Lavagna su cavalletto: spiegazione. */
export function BoardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3.5" width="18" height="12.5" rx="1.5" {...tint} />
      <rect x="3" y="3.5" width="18" height="12.5" rx="1.5" />
      <path d="M7 8h6M7 11.5h9M8.5 16 6.5 21M15.5 16l2 5" />
    </Icon>
  )
}

/** Foglio e matita: esercitazione. */
export function ExerciseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H14l4 4v4" />
      <path d="M5 4.5v15A1.5 1.5 0 0 0 6.5 21H11" />
      <path d="M8.5 9h5M8.5 12.5h3" />
      <path d="m17.6 13.4 2.5 2.5-5.3 5.3H12.3v-2.5Z" {...tint} />
      <path d="m17.6 13.4 2.5 2.5-5.3 5.3H12.3v-2.5Z" />
    </Icon>
  )
}

/** Monitor con codice: laboratorio. */
export function LabIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="19" height="13" rx="1.75" {...tint} />
      <rect x="2.5" y="3.5" width="19" height="13" rx="1.75" />
      <path d="m9.5 7.5-2.5 2.5 2.5 2.5M14.5 7.5l2.5 2.5-2.5 2.5M9 20.5h6M12 16.5v4" />
    </Icon>
  )
}

/** Frecce in cerchio attorno a un segno: ripasso. */
export function ReviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" {...tint} />
      <path d="M4.5 10.5a7.8 7.8 0 0 1 13.4-4.2M18.5 2.8v3.7h-3.7M19.5 13.5a7.8 7.8 0 0 1-13.4 4.2M5.5 21.2v-3.7h3.7" />
      <path d="m10.3 12 1.2 1.2 2.2-2.4" />
    </Icon>
  )
}

/** Foglio con voto cerchiato: verifica scritta. */
export function WrittenTestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5Z" {...tint} />
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5Z" />
      <path d="M8.5 13h7M8.5 16.5h4.5" />
      <circle cx="14.5" cy="8" r="2.4" />
      <path d="M8.5 7h2.5M8.5 9.3h1.5" />
    </Icon>
  )
}

/** Fumetto con punto di domanda: interrogazione. */
export function OralIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z" {...tint} />
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z" />
      <path d="M10 7.6a2.1 2.1 0 1 1 2.9 2c-.6.3-.9.8-.9 1.4v.3" />
      <path d="M12 13.4h.01" strokeWidth={2.4} />
    </Icon>
  )
}

/** Finestra di terminale: prova pratica. */
export function PracticalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4" width="19" height="16" rx="2" {...tint} />
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M2.5 8h19M5.3 6h.01M7.6 6h.01" />
      <path d="m7 12 2.5 2L7 16M12 16h4.5" />
    </Icon>
  )
}

/** Stellina: voto minore. */
export function MinorGradeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4.5 2.1 4.4 4.8.6-3.5 3.3.9 4.8L12 15.3l-4.3 2.3.9-4.8-3.5-3.3 4.8-.6Z" {...tint} />
      <path d="m12 4.5 2.1 4.4 4.8.6-3.5 3.3.9 4.8L12 15.3l-4.3 2.3.9-4.8-3.5-3.3 4.8-.6Z" />
    </Icon>
  )
}

/** Tre puntini in un riquadro: altro. */
export function OtherIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" {...tint} />
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth={2.6} />
    </Icon>
  )
}

/** Edificio con colonne: educazione civica. */
export function CivicsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9 12 4l8.5 5Z" {...tint} />
      <path d="M3.5 9 12 4l8.5 5ZM5 20.5h14M3.5 20.5h17M6.5 9.5v8M10 9.5v8M14 9.5v8M17.5 9.5v8M5 17.5h14" />
    </Icon>
  )
}

/** Elenco con spunte: materiale da preparare. */
export function PrepIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" {...tint} />
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="m7.5 8.5 1.3 1.3 2.2-2.4M13.5 8.5H17M7.5 14.5l1.3 1.3 2.2-2.4M13.5 14.5H17" />
    </Icon>
  )
}

/** Calendario con freccia verso l"esterno: aggiungi a Google Calendar. */
export function CalendarAddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.5h17V7a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2Z" {...tint} />
      <path d="M12 20.5H5.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v5M3.5 9.5h17M8 3v4M16 3v4M18 15v6M15 18h6" />
    </Icon>
  )
}

/** Due persone alla cattedra: compresenza con l"ITP / laboratorio. */
export function LabHoursIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="7" r="2.5" {...tint} />
      <circle cx="8" cy="7" r="2.5" />
      <circle cx="16" cy="7" r="2.5" />
      <path d="M3.5 15.5a4.5 4.5 0 0 1 9 0M11.5 15.5a4.5 4.5 0 0 1 9 0M2.5 19.5h19" />
    </Icon>
  )
}

// --- Navigazione ------------------------------------------------------------------------

/** Settimana: calendario con le colonne dei giorni. */
export function WeekIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.5h17V7a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2Z" {...tint} />
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13.5v3M12 13.5v3M16.5 13.5v3" />
    </Icon>
  )
}

/** Classi: banchi visti dall'alto con la cattedra. */
export function ClassesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="3" width="10" height="3.5" rx="1" {...tint} />
      <rect x="7" y="3" width="10" height="3.5" rx="1" />
      <rect x="3.5" y="10" width="6.5" height="4" rx="1" />
      <rect x="14" y="10" width="6.5" height="4" rx="1" />
      <rect x="3.5" y="17" width="6.5" height="4" rx="1" />
      <rect x="14" y="17" width="6.5" height="4" rx="1" />
    </Icon>
  )
}

/** Note: due foglietti sovrapposti, come sulla bacheca di Keep. */
export function NotesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5h11a1.5 1.5 0 0 1 1.5 1.5v9.5l-4.5 4.5H8A1.5 1.5 0 0 1 6.5 17.5V5A1.5 1.5 0 0 1 8 3.5Z" {...tint} />
      <path d="M8 3.5h11a1.5 1.5 0 0 1 1.5 1.5v9.5l-4.5 4.5H8A1.5 1.5 0 0 1 6.5 17.5V5A1.5 1.5 0 0 1 8 3.5Z" />
      <path d="M20.5 14.5h-3a1.5 1.5 0 0 0-1.5 1.5v3M10 8h7M10 11.5h4.5" />
      <path d="M3.5 7.5v12A1.5 1.5 0 0 0 5 21h9.5" />
    </Icon>
  )
}

/** Puntina: nota fissata in cima. */
export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3.5h6l-1 6 3.5 3.5v1.5h-11V13L10 9.5Z" {...tint} />
      <path d="M9 3.5h6l-1 6 3.5 3.5v1.5h-11V13L10 9.5ZM12 14.5V21" />
    </Icon>
  )
}

/** Casella spuntata: aggiunge una riga da spuntare. */
export function CheckboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" {...tint} />
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  )
}

/** Riunioni: tavolo con le sedie intorno, visto dall'alto come i banchi delle classi. */
export function MeetingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="7.5" width="12" height="9" rx="4.5" {...tint} />
      <rect x="6" y="7.5" width="12" height="9" rx="4.5" />
      <path d="M8.5 4h2.5M13 4h2.5M8.5 20h2.5M13 20h2.5M2.5 10.5v3M21.5 10.5v3" />
    </Icon>
  )
}

/** Programma: elenco con sotto-punti. */
export function ProgramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3.5" width="4" height="4" rx="1" {...tint} />
      <rect x="3" y="3.5" width="4" height="4" rx="1" />
      <rect x="3" y="15.5" width="4" height="4" rx="1" />
      <path d="M10.5 5.5H21M13.5 11.5H21M10.5 17.5H21M5 7.5v4h5" />
    </Icon>
  )
}

/** Anno scolastico: calendario diviso in due metà (i quadrimestri). */
export function YearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9.5h8.5V20.5H5.5a2 2 0 0 1-2-2Z" {...tint} />
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M12 9.5v11" />
    </Icon>
  )
}

/** Voti: coccarda. */
export function GradesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="5.5" {...tint} />
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.6 13.3-1.6 7.2 5-2.5 5 2.5-1.6-7.2" />
      <path d="m10 9 1.4 1.4L14 7.8" />
    </Icon>
  )
}

// --- Azioni -----------------------------------------------------------------------------

/** Bacchetta con scintille: proposta automatica. */
export function SuggestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m3.5 20.5 11-11" />
      <path d="m13 8 1.5-1.5 3 3L16 11Z" {...tint} />
      <path d="m13 8 1.5-1.5 3 3L16 11Z" />
      <path d="M18 2.5v3M16.5 4h3M20.5 10.5v2M19.5 11.5h2M9 3v2M8 4h2" />
    </Icon>
  )
}

/** Lezione che salta alla successiva. */
export function ShiftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="12" width="7" height="8.5" rx="1.5" strokeDasharray="2.2 2.2" />
      <rect x="14.5" y="12" width="7" height="8.5" rx="1.5" {...tint} />
      <rect x="14.5" y="12" width="7" height="8.5" rx="1.5" />
      <path d="M6 9.5C6 5.5 9 3.5 12 3.5s6 2 6 6" />
      <path d="m15.5 7.5 2.5 2.5 2.5-2.5" />
    </Icon>
  )
}

/** Cerchio con spunta: fatto. */
export function DoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" {...tint} />
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12.3 2.5 2.5 4.9-5.2" />
    </Icon>
  )
}

/** Calendario barrato: lezione annullata. */
export function CancelledIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M9.5 12.5l5 5M14.5 12.5l-5 5" />
    </Icon>
  )
}

/** Appunti: foglietto con angolo piegato. */
export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V14l-6 6.5h-7a2 2 0 0 1-2-2Z" {...tint} />
      <path d="M4.5 5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V14l-6 6.5h-7a2 2 0 0 1-2-2Z" />
      <path d="M19.5 14h-4a2 2 0 0 0-2 2v4.5M8 8h8M8 11.5h5" />
    </Icon>
  )
}

/** Appunti incollati: importazione da una nota. */
export function PasteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="4.5" width="15" height="17" rx="2" {...tint} />
      <path d="M9 4.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2H15" />
      <rect x="9" y="2.5" width="6" height="4" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </Icon>
  )
}

/** Due fogli sovrapposti: copia il testo. */
export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8.5" y="8.5" width="12" height="12.5" rx="2" {...tint} />
      <rect x="8.5" y="8.5" width="12" height="12.5" rx="2" />
      <path d="M15.5 8.5V5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h3" />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  )
}

/** Due strade che diventano una: unisci due valutazioni in un voto solo. */
export function MergeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="18.5" r="2.5" {...tint} />
      <circle cx="12" cy="18.5" r="2.5" />
      <path d="M6 3.5v3a5.5 5.5 0 0 0 5.5 5.5h1A5.5 5.5 0 0 0 18 6.5v-3M12 12v4" />
    </Icon>
  )
}

/** Una strada che si divide in due: separa un voto da quello a cui era unito. */
export function SplitIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5.5" r="2.5" {...tint} />
      <circle cx="12" cy="5.5" r="2.5" />
      <path d="M12 8v4M6 20.5v-3a5.5 5.5 0 0 1 5.5-5.5h1a5.5 5.5 0 0 1 5.5 5.5v3" />
    </Icon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 7h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5Z" {...tint} />
      <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M10 11v6M14 11v6" />
    </Icon>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15.5 4.5 4 4L9 19H5v-4Z" {...tint} />
      <path d="m15.5 4.5 4 4L9 19H5v-4ZM13 7l4 4M4 21.5h16" />
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Icon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  )
}

/** Righe alte con un rigo sotto: la lista estesa. */
export function ListRoomyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4" width="17" height="7" rx="1.5" {...tint} />
      <rect x="3.5" y="4" width="17" height="7" rx="1.5" />
      <rect x="3.5" y="13" width="17" height="7" rx="1.5" />
      <path d="M7 7.5h7M7 16.5h7" />
    </Icon>
  )
}

/** Righe strette, una sotto l'altra: la lista compatta. */
export function ListCompactIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      <rect x="3" y="4.5" width="18" height="3" rx="1" {...tint} />
    </Icon>
  )
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  )
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16" />
    </Icon>
  )
}

/** Registro di classe aperto, con le righe e la matita: gli argomenti da copiare nel registro. */
export function RegisterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5Z" {...tint} />
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V11" />
      <path d="M12 6.5V20M6 9c1.5-.1 2.8.1 4 .6M6 12.5c1.5-.1 2.8.1 4 .6" />
      <path d="m15 13.5 5.5-5.5a1.4 1.4 0 0 0-2-2L13 11.5l-.5 2.5Z" />
    </Icon>
  )
}

/** Orario: tabella con la riga dei giorni e due ore colorate. */
export function TimetableIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 9.5h5.5V14H9ZM14.5 14H20v4.5a2 2 0 0 1-2 2h-3.5Z" {...tint} />
      <rect x="3.5" y="4" width="17" height="16.5" rx="2" />
      <path d="M3.5 9.5h17M3.5 15h17M9 4v16.5M14.5 4v16.5" />
    </Icon>
  )
}

/** Stampante con il foglio che esce. */
export function PrintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8.5" width="18" height="8.5" rx="2" {...tint} />
      <path d="M7 8.5V3.5h10v5M7 17H5a2 2 0 0 1-2-2v-4.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="13.5" width="10" height="7" rx="1" />
      <path d="M17 11.5h.01" />
    </Icon>
  )
}

/** Telefono con freccia verso il basso: installa l'app. */
export function InstallIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" {...tint} />
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M12 7v7M9.2 11.5 12 14.3l2.8-2.8M10.5 18.5h3" />
    </Icon>
  )
}

/** Il pulsante Condividi di Safari: riquadro con freccia verso l'alto. */
export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5M12 14V3M8.5 6.5 12 3l3.5 3.5" />
    </Icon>
  )
}

/** Riquadro con il più: "Aggiungi alla schermata Home". */
export function AddSquareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </Icon>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8M4.5 16v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V16" />
    </Icon>
  )
}

/** Avviso: triangolo con punto esclamativo. */
export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3Z" {...tint} />
      <path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3ZM12 9.5v4" />
      <path d="M12 16.8h.01" strokeWidth={2.4} />
    </Icon>
  )
}

// --- Tema ------------------------------------------------------------------------------

/** Sole: tema chiaro. */
export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" {...tint} />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Icon>
  )
}

const moon = 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z'

/** Luna: tema scuro. */
export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={moon} {...tint} />
      <path d={moon} />
    </Icon>
  )
}

/** Cerchio metà pieno: il tema segue il sistema. */
export function SystemThemeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" fillOpacity={0.5} stroke="none" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
    </Icon>
  )
}

// --- Sincronizzazione -------------------------------------------------------------------

const cloud = 'M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6A3.8 3.8 0 0 1 17.2 18.5Z'

export function CloudIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={cloud} {...tint} />
      <path d={cloud} />
    </Icon>
  )
}

export function CloudCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={cloud} {...tint} />
      <path d={cloud} />
      <path d="m9.3 13.5 1.9 1.9 3.6-3.8" />
    </Icon>
  )
}

export function CloudUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={cloud} {...tint} />
      <path d={cloud} />
      <path d="M12 16v-4.5M9.8 13.5 12 11.3l2.2 2.2" />
    </Icon>
  )
}

export function CloudOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={cloud} />
      <path d="m3.5 3.5 17 17" />
    </Icon>
  )
}

/** Il logo di Google nei suoi colori, come chiedono le linee guida del pulsante di accesso. */
export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.2V7.2H2.1a11 11 0 0 0 0 9.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.2L5.8 10C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  )
}
