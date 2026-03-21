import { Component, input, signal, OnInit } from '@angular/core';

interface Tip {
  ar: string;
  en: string;
}

const TIPS: Record<string, Tip[]> = {
  STUDENT: [
    { ar: 'يمكنك متابعة درجاتك وحضورك مباشرة من التطبيق', en: 'Track your grades and attendance directly from the app' },
    { ar: 'استخدم رمز QR الخاص بك لربط حساب ولي أمرك', en: 'Use your QR code to link your parent\'s account' },
    { ar: 'يمكنك التسجيل في مقررات جديدة من صفحة المقررات', en: 'Enroll in new courses from the Courses page' },
    { ar: 'تابع جلساتك القادمة ومواعيدها من الصفحة الرئيسية', en: 'Check your upcoming sessions and schedules from home' },
    { ar: 'يمكنك طلب ترقية صفك الدراسي من صفحة الملف الشخصي', en: 'Request grade promotion from your profile page' },
  ],
  TEACHER: [
    { ar: 'يمكنك إنشاء مجموعات وجداول حصص لكل مقرر', en: 'Create groups and class schedules for each course' },
    { ar: 'استخدم رموز QR لتسهيل تسجيل حضور الطلاب', en: 'Use QR codes to simplify student attendance' },
    { ar: 'يمكنك إدارة أكاديميتك ودعوة معلمين آخرين', en: 'Manage your academy and invite other teachers' },
    { ar: 'أدخل درجات الطلاب مباشرة من صفحة إدخال الدرجات', en: 'Enter student grades directly from the marks entry page' },
    { ar: 'تابع تقارير الغياب لطلابك من التقارير', en: 'Monitor absence reports for your students' },
  ],
  PARENT: [
    { ar: 'يمكنك متابعة حضور وغياب أبنائك ودرجاتهم مباشرة', en: 'Track your children\'s attendance and grades directly' },
    { ar: 'اربط حساب طفلك باستخدام كود الطالب أو رمز QR', en: 'Link your child\'s account using student code or QR' },
    { ar: 'يمكنك تسجيل أبنائك في مقررات جديدة', en: 'Enroll your children in new courses' },
    { ar: 'تابع الإشعارات لمعرفة آخر التحديثات عن أبنائك', en: 'Follow notifications for the latest updates about your children' },
    { ar: 'يمكنك الموافقة على طلبات ترقية الصف لأبنائك', en: 'Approve grade promotion requests for your children' },
  ],
  SECRETARY: [
    { ar: 'يمكنك ربط حسابك بمعلمين لإدارة مقرراتهم', en: 'Link your account with teachers to manage their courses' },
    { ar: 'تابع طلبات الربط ومعالجتها من صفحة الطلبات', en: 'Track and process link requests from the requests page' },
    { ar: 'يمكنك إدارة حضور وغياب الطلاب نيابة عن المعلم', en: 'Manage student attendance on behalf of the teacher' },
    { ar: 'استخدم تقارير الغياب لمتابعة انتظام الطلاب', en: 'Use absence reports to monitor student regularity' },
  ],
};

@Component({
  selector: 'app-did-you-know',
  standalone: true,
  template: `
    <div class="tip-card" dir="rtl">
      <div class="tip-icon"><i class="fas fa-lightbulb"></i></div>
      <div class="tip-content">
        <span class="tip-label">هل تعلم؟ · Did you know?</span>
        <span class="tip-text">{{ currentTip().ar }}</span>
        <span class="tip-text-en">{{ currentTip().en }}</span>
      </div>
    </div>
  `,
  styles: [`
    .tip-card {
      display: flex;
      align-items: flex-start;
      gap: .65rem;
      margin: .5rem 1rem 0;
      padding: .75rem .85rem;
      background: linear-gradient(135deg, rgba(102,126,234,.06), rgba(118,75,162,.06));
      border: 1.5px solid rgba(102,126,234,.15);
      border-radius: 14px;
    }
    .tip-icon {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: .85rem; color: #fbbf24; }
    }
    .tip-content {
      flex: 1; display: flex; flex-direction: column; gap: .1rem;
    }
    .tip-label { font-size: .68rem; font-weight: 700; color: #667eea; }
    .tip-text { font-size: .78rem; font-weight: 600; color: #1a1a2e; line-height: 1.4; }
    .tip-text-en { font-size: .68rem; color: #9090aa; }
  `],
})
export class DidYouKnowComponent implements OnInit {
  role = input<string>('STUDENT');
  currentTip = signal<Tip>({ ar: '', en: '' });

  ngOnInit(): void {
    const tips = TIPS[this.role().toUpperCase()] || TIPS['STUDENT'];
    // Pick a random tip based on the day (changes daily)
    const dayIndex = new Date().getDate() % tips.length;
    this.currentTip.set(tips[dayIndex]);
  }
}
