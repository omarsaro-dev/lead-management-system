# نشر Lead Management API على Vercel

## إعداد المشروع

1. افتح https://vercel.com/new.
2. استورد مستودع `omarsaro-dev/lead-management-system`.
3. اترك **Root Directory** على جذر المستودع.
4. لا تستخدم `UI` كـ Root Directory؛ هذا النشر مخصص للـ API فقط.
5. اضغط Deploy.

يستخدم المشروع `api/index.py` و`vercel.json` لتشغيل FastAPI كـ Python Serverless Function.

## اختبار الخدمة

بعد النشر افتح:

```text
https://YOUR-PROJECT.vercel.app/health
https://YOUR-PROJECT.vercel.app/docs
```

## ربط واجهة Next.js

في مشروع الواجهة على Vercel، أضف Environment Variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-PROJECT.vercel.app
```

ثم أعد Deploy للواجهة.

## ملاحظة قاعدة البيانات

Vercel يملك نظام ملفات مؤقتًا. عند تشغيل `VERCEL=1` يستخدم التطبيق `/tmp/leadflow-data/leads.db` حتى لا يفشل بسبب نظام الملفات للقراءة فقط، لكن البيانات قد تختفي عند إعادة تشغيل Function أو إنشاء Instance جديد. هذا مناسب للتجربة فقط. للاستخدام الحقيقي استخدم PostgreSQL أو خدمة قاعدة بيانات خارجية.
