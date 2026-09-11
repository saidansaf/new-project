// Yengil i18n tizimi. Hozircha navbar/sidebar va asosiy statik matnlarni qamraydi;
// kurs/dars mazmuni tarjimasi keyingi bosqichda kengaytiriladi.

const DICT = {
  uz: {
    courses: 'Kurslar',
    typing: 'Typing',
    dashboard: 'Dashboard',
    create_course: 'Kurs yaratish',
    admin: 'Admin',
    login: 'Kirish',
    register: "Ro'yxatdan o'tish",
    logout: 'Platformadan chiqish',
    profile: 'Profil',
    language: 'Til',
    notifications: 'Bildirishnomalar',
    mark_all_read: 'Hammasini oʻqish',
    all: 'Hammasi',
    unread: 'Oʻqilmagan',
    no_notifications: 'Hozircha bildirishnoma yoʻq.',
    brand: 'EduNest',
  },
  en: {
    courses: 'Courses',
    typing: 'Typing',
    dashboard: 'Dashboard',
    create_course: 'Create Course',
    admin: 'Admin',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    profile: 'Profile',
    language: 'Language',
    notifications: 'Notifications',
    mark_all_read: 'Mark all read',
    all: 'All',
    unread: 'Unread',
    no_notifications: 'No notifications yet.',
    brand: 'EduNest',
  },
  ru: {
    courses: 'Курсы',
    typing: 'Тайпинг',
    dashboard: 'Панель',
    create_course: 'Создать курс',
    admin: 'Админ',
    login: 'Войти',
    register: 'Регистрация',
    logout: 'Выйти',
    profile: 'Профиль',
    language: 'Язык',
    notifications: 'Уведомления',
    mark_all_read: 'Прочитать всё',
    all: 'Все',
    unread: 'Непрочит.',
    no_notifications: 'Пока нет уведомлений.',
    brand: 'EduNest',
  },
};

const LANG_KEY = 'edunest_lang';
export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
];

export function getLang() {
  return localStorage.getItem(LANG_KEY) || 'uz';
}

export function setLang(code) {
  localStorage.setItem(LANG_KEY, code);
  window.location.reload();
}

export function t(key) {
  const lang = getLang();
  return (DICT[lang] && DICT[lang][key]) || DICT.uz[key] || key;
}
