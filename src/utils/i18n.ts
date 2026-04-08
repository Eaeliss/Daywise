import { usePreferencesStore } from '@/stores/preferences-store'

type TranslationSet = {
  // Common
  add: string
  save: string
  cancel: string
  delete: string
  edit: string
  done: string
  noData: string
  exportCSV: string
  // Dashboard
  greeting_morning: string
  greeting_afternoon: string
  greeting_evening: string
  today: string
  upcoming: string
  quickActions: string
  goals: string
  balance: string
  habits: string
  savingFor: string
  monthlyBudget: string
  nextGoalDeadline: string
  noEventsToday: string
  viewCalendar: string
  quickAdd: string
  // Habits
  todayProgress: string
  allDone: string
  remaining: string
  noHabitsYet: string
  addFirstHabit: string
  newHabit: string
  renameHabit: string
  addHabit: string
  dayStreak: string
  noStreak: string
  missedYesterday: string
  // Goals
  active: string
  completed: string
  overdue: string
  onTrack: string
  addGoal: string
  newGoal: string
  goalTitle: string
  description: string
  deadline: string
  progressTarget: string
  noGoalsYet: string
  addFirstGoal: string
  milestones: string
  addMilestone: string
  updateProgress: string
  currentProgress: string
  // Calendar
  noEvents: string
  newEvent: string
  eventTitle: string
  endDate: string
  repeat: string
  repeatNone: string
  repeatDaily: string
  repeatWeekly: string
  repeatMonthly: string
  addEvent: string
  // Finances
  income: string
  expense: string
  transactions: string
  recurring: string
  savings: string
  budget: string
  noTransactions: string
  addTransaction: string
  amount: string
  category: string
  // Notes
  notes: string
  noNotes: string
  addNote: string
  noteTitle: string
  // Settings
  settings: string
  preferences: string
  appearance: string
  language: string
  currency: string
  notifications: string
  light: string
  dark: string
  system: string
  signOut: string
  // School
  school: string
  courses: string
  assignments: string
  noCoursesYet: string
  connectCanvas: string
  completed_label: string
  pending: string
}

const translations: Record<string, Partial<TranslationSet>> = {
  en: {
    add: 'Add', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', done: 'Done',
    noData: 'No data', exportCSV: 'Export CSV',
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
    today: 'Today', upcoming: 'Upcoming', quickActions: 'Quick actions',
    goals: 'Goals', balance: 'Balance', habits: 'Habits', savingFor: 'Saving for',
    monthlyBudget: 'Monthly Budget', nextGoalDeadline: 'Next Goal Deadline',
    noEventsToday: 'No events today', viewCalendar: 'View calendar', quickAdd: 'Quick Add',
    todayProgress: "Today's Progress", allDone: 'All done!', remaining: 'remaining',
    noHabitsYet: 'No habits yet', addFirstHabit: 'Tap + to add your first daily habit.',
    newHabit: 'New Habit', renameHabit: 'Rename Habit', addHabit: 'Add Habit',
    dayStreak: 'day streak', noStreak: 'No streak yet', missedYesterday: 'missed yesterday',
    active: 'Active', completed: 'Completed', overdue: 'overdue', onTrack: 'On track',
    addGoal: 'Add Goal', newGoal: 'New Goal', goalTitle: 'Goal title', description: 'Description',
    deadline: 'Deadline', progressTarget: 'Progress target', noGoalsYet: 'No goals yet',
    addFirstGoal: 'Tap + to set your first goal.', milestones: 'Milestones',
    addMilestone: 'Add milestone', updateProgress: 'Update Progress', currentProgress: 'Current progress',
    noEvents: 'No events', newEvent: 'New Event', eventTitle: 'Event title', endDate: 'End date (optional)',
    repeat: 'Repeat', repeatNone: 'None', repeatDaily: 'Daily', repeatWeekly: 'Weekly', repeatMonthly: 'Monthly',
    addEvent: 'Add Event',
    income: 'Income', expense: 'Expense', transactions: 'Transactions', recurring: 'Recurring',
    savings: 'Savings', budget: 'Budget', noTransactions: 'No transactions', addTransaction: 'Add Transaction',
    amount: 'Amount', category: 'Category',
    notes: 'Notes', noNotes: 'No notes yet', addNote: 'Add Note', noteTitle: 'Note title',
    settings: 'Settings', preferences: 'Preferences', appearance: 'Appearance', language: 'Language',
    currency: 'Currency', notifications: 'Notifications', light: 'Light', dark: 'Dark', system: 'System default',
    signOut: 'Sign out',
    school: 'School', courses: 'Courses', assignments: 'Assignments', noCoursesYet: 'No courses yet',
    connectCanvas: 'Connect Canvas', completed_label: 'Completed', pending: 'Pending',
  },
  he: {
    add: 'הוסף', save: 'שמור', cancel: 'בטל', delete: 'מחק', edit: 'ערוך', done: 'סיום',
    noData: 'אין נתונים', exportCSV: 'ייצא CSV',
    greeting_morning: 'בוקר טוב', greeting_afternoon: 'צהריים טובים', greeting_evening: 'ערב טוב',
    today: 'היום', upcoming: 'קרוב', quickActions: 'פעולות מהירות',
    goals: 'מטרות', balance: 'יתרה', habits: 'הרגלים', savingFor: 'חוסך עבור',
    monthlyBudget: 'תקציב חודשי', nextGoalDeadline: 'מועד המטרה הבאה',
    noEventsToday: 'אין אירועים היום', viewCalendar: 'לוח שנה', quickAdd: 'הוספה מהירה',
    todayProgress: 'התקדמות היום', allDone: 'הכל הושלם!', remaining: 'נותר',
    noHabitsYet: 'אין הרגלים עדיין', addFirstHabit: 'לחץ + להוספת הרגל יומי.',
    newHabit: 'הרגל חדש', renameHabit: 'שנה שם הרגל', addHabit: 'הוסף הרגל',
    dayStreak: 'ימים רצוף', noStreak: 'אין רצף עדיין', missedYesterday: 'הוחמצו אתמול',
    active: 'פעיל', completed: 'הושלם', overdue: 'באיחור', onTrack: 'על המסלול',
    addGoal: 'הוסף מטרה', newGoal: 'מטרה חדשה', goalTitle: 'כותרת', description: 'תיאור',
    deadline: 'מועד אחרון', progressTarget: 'יעד התקדמות', noGoalsYet: 'אין מטרות עדיין',
    addFirstGoal: 'לחץ + להגדרת מטרה.', milestones: 'אבני דרך', addMilestone: 'הוסף אבן דרך',
    updateProgress: 'עדכן התקדמות', currentProgress: 'התקדמות נוכחית',
    noEvents: 'אין אירועים', newEvent: 'אירוע חדש', eventTitle: 'כותרת אירוע',
    endDate: 'תאריך סיום (אופציונלי)', repeat: 'חזרה', repeatNone: 'ללא', repeatDaily: 'יומי',
    repeatWeekly: 'שבועי', repeatMonthly: 'חודשי', addEvent: 'הוסף אירוע',
    income: 'הכנסה', expense: 'הוצאה', transactions: 'עסקאות', recurring: 'קבוע',
    savings: 'חסכונות', budget: 'תקציב', noTransactions: 'אין עסקאות', addTransaction: 'הוסף עסקה',
    amount: 'סכום', category: 'קטגוריה',
    notes: 'הערות', noNotes: 'אין הערות עדיין', addNote: 'הוסף הערה', noteTitle: 'כותרת הערה',
    settings: 'הגדרות', preferences: 'העדפות', appearance: 'מראה', language: 'שפה',
    currency: 'מטבע', notifications: 'התראות', light: 'בהיר', dark: 'כהה', system: 'ברירת מחדל',
    signOut: 'התנתק',
    school: 'בית ספר', courses: 'קורסים', assignments: 'מטלות', noCoursesYet: 'אין קורסים עדיין',
    connectCanvas: 'חבר Canvas', completed_label: 'הושלם', pending: 'ממתין',
  },
  es: {
    add: 'Agregar', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', done: 'Listo',
    noData: 'Sin datos', exportCSV: 'Exportar CSV',
    greeting_morning: 'Buenos días', greeting_afternoon: 'Buenas tardes', greeting_evening: 'Buenas noches',
    today: 'Hoy', upcoming: 'Próximos', quickActions: 'Acciones rápidas',
    goals: 'Metas', balance: 'Saldo', habits: 'Hábitos', savingFor: 'Ahorrando para',
    monthlyBudget: 'Presupuesto mensual', nextGoalDeadline: 'Próxima meta',
    noEventsToday: 'Sin eventos hoy', viewCalendar: 'Ver calendario', quickAdd: 'Agregar rápido',
    todayProgress: 'Progreso de hoy', allDone: '¡Todo listo!', remaining: 'restante',
    noHabitsYet: 'Sin hábitos aún', addFirstHabit: 'Toca + para agregar tu primer hábito.',
    newHabit: 'Nuevo hábito', renameHabit: 'Renombrar hábito', addHabit: 'Agregar hábito',
    dayStreak: 'días seguidos', noStreak: 'Sin racha aún', missedYesterday: 'omitidos ayer',
    active: 'Activo', completed: 'Completado', overdue: 'atrasado', onTrack: 'Al día',
    addGoal: 'Agregar meta', newGoal: 'Nueva meta', goalTitle: 'Título', description: 'Descripción',
    deadline: 'Fecha límite', progressTarget: 'Meta de progreso', noGoalsYet: 'Sin metas aún',
    addFirstGoal: 'Toca + para tu primera meta.', milestones: 'Hitos', addMilestone: 'Agregar hito',
    updateProgress: 'Actualizar progreso', currentProgress: 'Progreso actual',
    noEvents: 'Sin eventos', newEvent: 'Nuevo evento', eventTitle: 'Título del evento',
    endDate: 'Fecha fin (opcional)', repeat: 'Repetir', repeatNone: 'Nunca', repeatDaily: 'Diario',
    repeatWeekly: 'Semanal', repeatMonthly: 'Mensual', addEvent: 'Agregar evento',
    income: 'Ingreso', expense: 'Gasto', transactions: 'Transacciones', recurring: 'Recurrente',
    savings: 'Ahorros', budget: 'Presupuesto', noTransactions: 'Sin transacciones',
    addTransaction: 'Agregar transacción', amount: 'Monto', category: 'Categoría',
    notes: 'Notas', noNotes: 'Sin notas aún', addNote: 'Agregar nota', noteTitle: 'Título',
    settings: 'Ajustes', preferences: 'Preferencias', appearance: 'Apariencia', language: 'Idioma',
    currency: 'Moneda', notifications: 'Notificaciones', light: 'Claro', dark: 'Oscuro',
    system: 'Sistema', signOut: 'Cerrar sesión',
    school: 'Escuela', courses: 'Cursos', assignments: 'Tareas', noCoursesYet: 'Sin cursos aún',
    connectCanvas: 'Conectar Canvas', completed_label: 'Completado', pending: 'Pendiente',
  },
  fr: {
    add: 'Ajouter', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', done: 'Terminé',
    greeting_morning: 'Bonjour', greeting_afternoon: 'Bon après-midi', greeting_evening: 'Bonsoir',
    today: "Aujourd'hui", upcoming: 'À venir', quickActions: 'Actions rapides',
    goals: 'Objectifs', balance: 'Solde', habits: 'Habitudes', savingFor: 'Économiser pour',
    noEventsToday: 'Aucun événement', viewCalendar: 'Voir le calendrier', quickAdd: 'Ajout rapide',
    todayProgress: "Progrès d'aujourd'hui", allDone: 'Tout terminé!', remaining: 'restant',
    noHabitsYet: 'Aucune habitude', addFirstHabit: 'Appuyez sur + pour ajouter une habitude.',
    newHabit: 'Nouvelle habitude', renameHabit: "Renommer l'habitude", addHabit: 'Ajouter',
    dayStreak: 'jours consécutifs', noStreak: 'Pas encore de série',
    noGoalsYet: 'Aucun objectif', noEvents: 'Aucun événement', newEvent: 'Nouvel événement',
    repeat: 'Répéter', repeatNone: 'Jamais', repeatDaily: 'Quotidien', repeatWeekly: 'Hebdomadaire',
    repeatMonthly: 'Mensuel', income: 'Revenu', expense: 'Dépense', signOut: 'Se déconnecter',
    school: 'École', courses: 'Cours', assignments: 'Devoirs', connectCanvas: 'Connecter Canvas',
  },
  de: {
    add: 'Hinzufügen', save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', done: 'Fertig',
    greeting_morning: 'Guten Morgen', greeting_afternoon: 'Guten Tag', greeting_evening: 'Guten Abend',
    today: 'Heute', upcoming: 'Bevorstehend', quickActions: 'Schnellaktionen',
    goals: 'Ziele', balance: 'Kontostand', habits: 'Gewohnheiten',
    noEventsToday: 'Keine Ereignisse heute', viewCalendar: 'Kalender', quickAdd: 'Schnell hinzufügen',
    todayProgress: 'Heutiger Fortschritt', allDone: 'Alles erledigt!', remaining: 'verbleibend',
    noHabitsYet: 'Noch keine Gewohnheiten', newHabit: 'Neue Gewohnheit',
    dayStreak: 'Tage in Folge', noStreak: 'Noch keine Serie',
    noEvents: 'Keine Ereignisse', newEvent: 'Neues Ereignis', repeat: 'Wiederholen',
    repeatNone: 'Nie', repeatDaily: 'Täglich', repeatWeekly: 'Wöchentlich', repeatMonthly: 'Monatlich',
    income: 'Einnahmen', expense: 'Ausgaben', signOut: 'Abmelden',
    school: 'Schule', courses: 'Kurse', assignments: 'Aufgaben', connectCanvas: 'Canvas verbinden',
  },
  ar: {
    add: 'إضافة', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', done: 'تم',
    greeting_morning: 'صباح الخير', greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير',
    today: 'اليوم', upcoming: 'القادمة', quickActions: 'إجراءات سريعة',
    goals: 'الأهداف', balance: 'الرصيد', habits: 'العادات',
    noEventsToday: 'لا أحداث اليوم', viewCalendar: 'التقويم', quickAdd: 'إضافة سريعة',
    todayProgress: 'تقدم اليوم', allDone: 'تم كل شيء!', remaining: 'متبقي',
    noHabitsYet: 'لا عادات بعد', newHabit: 'عادة جديدة',
    dayStreak: 'أيام متتالية', noStreak: 'لا سلسلة بعد',
    noEvents: 'لا أحداث', newEvent: 'حدث جديد', repeat: 'تكرار',
    repeatNone: 'لا', repeatDaily: 'يومي', repeatWeekly: 'أسبوعي', repeatMonthly: 'شهري',
    income: 'دخل', expense: 'مصروف', signOut: 'تسجيل الخروج',
    school: 'المدرسة', courses: 'الدورات', assignments: 'الواجبات', connectCanvas: 'ربط Canvas',
  },
  ru: {
    add: 'Добавить', save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', done: 'Готово',
    greeting_morning: 'Доброе утро', greeting_afternoon: 'Добрый день', greeting_evening: 'Добрый вечер',
    today: 'Сегодня', upcoming: 'Предстоящие', quickActions: 'Быстрые действия',
    goals: 'Цели', balance: 'Баланс', habits: 'Привычки',
    noEventsToday: 'Событий нет', viewCalendar: 'Календарь', quickAdd: 'Быстрое добавление',
    todayProgress: 'Прогресс сегодня', allDone: 'Всё выполнено!', remaining: 'осталось',
    noHabitsYet: 'Нет привычек', newHabit: 'Новая привычка',
    dayStreak: 'дней подряд', noStreak: 'Нет серии',
    noEvents: 'Нет событий', newEvent: 'Новое событие', repeat: 'Повтор',
    repeatNone: 'Нет', repeatDaily: 'Ежедневно', repeatWeekly: 'Еженедельно', repeatMonthly: 'Ежемесячно',
    income: 'Доход', expense: 'Расход', signOut: 'Выйти',
    school: 'Учёба', courses: 'Курсы', assignments: 'Задания', connectCanvas: 'Подключить Canvas',
  },
  it: {
    add: 'Aggiungi', save: 'Salva', cancel: 'Annulla', delete: 'Elimina', done: 'Fatto',
    greeting_morning: 'Buongiorno', greeting_afternoon: 'Buon pomeriggio', greeting_evening: 'Buonasera',
    today: 'Oggi', upcoming: 'In arrivo', quickActions: 'Azioni rapide',
    goals: 'Obiettivi', balance: 'Saldo', habits: 'Abitudini',
    noEventsToday: 'Nessun evento oggi', viewCalendar: 'Calendario', quickAdd: 'Aggiunta rapida',
    todayProgress: 'Progresso di oggi', allDone: 'Tutto fatto!', remaining: 'rimanenti',
    dayStreak: 'giorni consecutivi', noStreak: 'Nessuna serie',
    repeat: 'Ripeti', repeatNone: 'Mai', repeatDaily: 'Giornaliero', repeatWeekly: 'Settimanale',
    repeatMonthly: 'Mensile', income: 'Entrata', expense: 'Spesa', signOut: 'Esci',
    school: 'Scuola', courses: 'Corsi', assignments: 'Compiti', connectCanvas: 'Connetti Canvas',
  },
  zh: {
    add: '添加', save: '保存', cancel: '取消', delete: '删除', done: '完成',
    greeting_morning: '早上好', greeting_afternoon: '下午好', greeting_evening: '晚上好',
    today: '今天', upcoming: '即将', quickActions: '快捷操作',
    goals: '目标', balance: '余额', habits: '习惯',
    noEventsToday: '今天没有事件', viewCalendar: '日历', quickAdd: '快速添加',
    todayProgress: '今日进度', allDone: '全部完成！', remaining: '剩余',
    dayStreak: '天连续', noStreak: '暂无连续',
    repeat: '重复', repeatNone: '不', repeatDaily: '每天', repeatWeekly: '每周', repeatMonthly: '每月',
    income: '收入', expense: '支出', signOut: '退出',
    school: '学校', courses: '课程', assignments: '作业', connectCanvas: '连接Canvas',
  },
  ja: {
    add: '追加', save: '保存', cancel: 'キャンセル', delete: '削除', done: '完了',
    greeting_morning: 'おはようございます', greeting_afternoon: 'こんにちは', greeting_evening: 'こんばんは',
    today: '今日', upcoming: '予定', quickActions: 'クイック操作',
    goals: '目標', balance: '残高', habits: '習慣',
    noEventsToday: '今日はイベントなし', viewCalendar: 'カレンダー', quickAdd: 'クイック追加',
    todayProgress: '今日の進捗', allDone: '全完了！', remaining: '残り',
    dayStreak: '日連続', noStreak: 'まだ連続なし',
    repeat: '繰り返し', repeatNone: 'なし', repeatDaily: '毎日', repeatWeekly: '毎週', repeatMonthly: '毎月',
    income: '収入', expense: '支出', signOut: 'サインアウト',
    school: '学校', courses: 'コース', assignments: '課題', connectCanvas: 'Canvas接続',
  },
  pt: {
    add: 'Adicionar', save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', done: 'Feito',
    greeting_morning: 'Bom dia', greeting_afternoon: 'Boa tarde', greeting_evening: 'Boa noite',
    today: 'Hoje', upcoming: 'Em breve', quickActions: 'Ações rápidas',
    goals: 'Metas', balance: 'Saldo', habits: 'Hábitos',
    noEventsToday: 'Sem eventos hoje', viewCalendar: 'Calendário', quickAdd: 'Adicionar rápido',
    todayProgress: 'Progresso de hoje', allDone: 'Tudo feito!', remaining: 'restante',
    dayStreak: 'dias seguidos', noStreak: 'Sem sequência',
    repeat: 'Repetir', repeatNone: 'Nunca', repeatDaily: 'Diário', repeatWeekly: 'Semanal',
    repeatMonthly: 'Mensal', income: 'Receita', expense: 'Despesa', signOut: 'Sair',
    school: 'Escola', courses: 'Cursos', assignments: 'Tarefas', connectCanvas: 'Conectar Canvas',
  },
  ko: {
    add: '추가', save: '저장', cancel: '취소', delete: '삭제', done: '완료',
    greeting_morning: '좋은 아침', greeting_afternoon: '안녕하세요', greeting_evening: '좋은 저녁',
    today: '오늘', upcoming: '예정', quickActions: '빠른 작업',
    goals: '목표', balance: '잔액', habits: '습관',
    noEventsToday: '오늘 일정 없음', viewCalendar: '달력', quickAdd: '빠른 추가',
    dayStreak: '일 연속', noStreak: '연속 없음',
    repeat: '반복', repeatNone: '없음', repeatDaily: '매일', repeatWeekly: '매주', repeatMonthly: '매월',
    income: '수입', expense: '지출', signOut: '로그아웃',
    school: '학교', courses: '강좌', assignments: '과제', connectCanvas: 'Canvas 연결',
  },
  tr: {
    add: 'Ekle', save: 'Kaydet', cancel: 'İptal', delete: 'Sil', done: 'Tamam',
    greeting_morning: 'Günaydın', greeting_afternoon: 'İyi günler', greeting_evening: 'İyi akşamlar',
    today: 'Bugün', upcoming: 'Yaklaşan', quickActions: 'Hızlı işlemler',
    goals: 'Hedefler', balance: 'Bakiye', habits: 'Alışkanlıklar',
    noEventsToday: 'Bugün etkinlik yok', viewCalendar: 'Takvim',
    dayStreak: 'gün seri', noStreak: 'Henüz seri yok',
    repeat: 'Tekrar', repeatNone: 'Yok', repeatDaily: 'Günlük', repeatWeekly: 'Haftalık',
    repeatMonthly: 'Aylık', income: 'Gelir', expense: 'Gider', signOut: 'Çıkış',
    school: 'Okul', courses: 'Dersler', assignments: 'Ödevler', connectCanvas: 'Canvas bağla',
  },
}

const en = translations['en'] as TranslationSet

export function t(key: keyof TranslationSet, lang: string): string {
  const set = translations[lang]
  if (!set) return en[key] ?? key
  return (set as TranslationSet)[key] ?? en[key] ?? key
}

/** Hook that returns a translator function bound to the current language preference. */
export function useT() {
  const language = usePreferencesStore((s) => s.language)
  return (key: keyof TranslationSet) => t(key, language)
}
