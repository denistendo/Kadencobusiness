import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

load_dotenv()  # MUST be here — before any os.getenv() calls

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# ────────────────────────────────────────────────
# SECURITY & ENVIRONMENT
# ────────────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-default-key-change-this')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')


# ────────────────────────────────────────────────
# APPLICATIONS & MIDDLEWARE
# ────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'backend_api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',              # For React → Django CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'kadencobackend.urls'

WSGI_APPLICATION = 'kadencobackend.wsgi.application'      # Correct — matches project name

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


# ────────────────────────────────────────────────
# DATABASE — Neon PostgreSQL (pooled connection)
# ────────────────────────────────────────────────

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=0,                 # Recommended for Neon pooled + scale-to-zero
        conn_health_checks=True,        # Detects stale/broken connections
        ssl_require=True
    )
}

# No need for extra OPTIONS block — dj_database_url + ssl_require=True handles SSL
# Neon pooled (PgBouncer transaction mode) works best with conn_max_age=0


# ────────────────────────────────────────────────
# STATIC FILES (WhiteNoise)
# ────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ────────────────────────────────────────────────
# CORS — Allow frontend during development
# ────────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = True           # ← TEMPORARY for testing
# When ready → replace with:
# CORS_ALLOWED_ORIGINS = [
#     "https://your-frontend.netlify.app",
#     "http://localhost:3000",         # for local dev
# ]


# ────────────────────────────────────────────────
# REST FRAMEWORK (basic token auth setup)
# ────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}


# ────────────────────────────────────────────────
# PRODUCTION HARDENING (optional but recommended)
# ────────────────────────────────────────────────

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # Render uses this
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
