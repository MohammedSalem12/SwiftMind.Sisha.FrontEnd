import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="privacy-page">
      <div class="container">
        <!-- Language Toggle -->
        <div class="lang-toggle">
          <button (click)="toggleLanguage()" class="lang-btn">
            {{ isArabic ? 'English' : 'العربية' }}
          </button>
        </div>

        @if (isArabic) {
          <!-- Arabic Version -->
          <h1>سياسة الخصوصية</h1>
          <p class="last-updated">آخر تحديث: 12 مارس 2026</p>

          <div class="section">
            <h2>مقدمة</h2>
            <p>
              مرحبًا بك في <strong>KAI (سويفت مايند سيشا)</strong>. نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. 
              توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية ومشاركة معلوماتك عند استخدام تطبيقنا التعليمي.
            </p>
          </div>

          <div class="section">
            <h2>المعلومات التي نجمعها</h2>
            <h3>معلومات الحساب</h3>
            <ul>
              <li>الاسم الكامل</li>
              <li>عنوان البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>الدور (طالب، معلم، ولي أمر، إداري)</li>
              <li>الصورة الشخصية (اختياري)</li>
            </ul>

            <h3>معلومات تسجيل الدخول عبر وسائل التواصل الاجتماعي</h3>
            <p>عند تسجيل الدخول باستخدام Google أو Facebook، نجمع:</p>
            <ul>
              <li>معرف المستخدم الخاص بالمنصة</li>
              <li>الاسم وعنوان البريد الإلكتروني</li>
              <li>صورة الملف الشخصي (إن وجدت)</li>
            </ul>

            <h3>البيانات الأكاديمية</h3>
            <ul>
              <li>سجلات الحضور والغياب</li>
              <li>الدرجات والنتائج</li>
              <li>التسجيل في الدورات</li>
              <li>التفاعلات مع المعلمين والطلاب</li>
            </ul>

            <h3>البيانات الفنية</h3>
            <ul>
              <li>عنوان IP</li>
              <li>نوع الجهاز ونظام التشغيل</li>
              <li>معرف الجهاز الفريد</li>
              <li>سجلات التطبيق والأخطاء</li>
            </ul>
          </div>

          <div class="section">
            <h2>كيف نستخدم معلوماتك</h2>
            <ul>
              <li>تقديم وتحسين خدماتنا التعليمية</li>
              <li>إدارة حسابك وتسجيل الدخول</li>
              <li>التواصل معك بشأن التحديثات والإشعارات</li>
              <li>تتبع الأداء الأكاديمي والحضور</li>
              <li>ضمان أمان المنصة ومنع الاحتيال</li>
              <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
            </ul>
          </div>

          <div class="section">
            <h2>مشاركة البيانات</h2>
            <p>نحن لا نبيع بياناتك الشخصية. قد نشارك المعلومات مع:</p>
            <ul>
              <li><strong>المعلمين وأولياء الأمور:</strong> للأغراض الأكاديمية المشروعة</li>
              <li><strong>مقدمي الخدمات:</strong> الذين يساعدون في تشغيل التطبيق (الاستضافة، التحليلات)</li>
              <li><strong>السلطات القانونية:</strong> عند الحاجة للامتثال للقوانين</li>
            </ul>
          </div>

          <div class="section">
            <h2>تسجيل الدخول عبر Facebook و Google</h2>
            <p>
              عند استخدام تسجيل الدخول عبر Facebook أو Google، نحصل على معلومات أساسية فقط (الاسم، البريد الإلكتروني، المعرف). 
              لا نصل إلى أي بيانات أخرى من حساباتك على هذه المنصات. يمكنك إلغاء هذا الوصول في أي وقت من خلال إعدادات حسابك على Facebook أو Google.
            </p>
          </div>

          <div class="section">
            <h2>أمان البيانات</h2>
            <p>نستخدم تدابير أمنية متقدمة لحماية بياناتك:</p>
            <ul>
              <li>تشفير البيانات أثناء النقل (HTTPS/TLS)</li>
              <li>تشفير البيانات المخزنة</li>
              <li>المصادقة الآمنة (OAuth 2.0)</li>
              <li>التحكم في الوصول على أساس الأدوار</li>
              <li>المراقبة الأمنية المنتظمة</li>
            </ul>
          </div>

          <div class="section">
            <h2>حقوقك</h2>
            <p>لديك الحق في:</p>
            <ul>
              <li><strong>الوصول:</strong> طلب نسخة من بياناتك الشخصية</li>
              <li><strong>التصحيح:</strong> تصحيح أي معلومات غير دقيقة</li>
              <li><strong>الحذف:</strong> طلب حذف بياناتك (انظر <a routerLink="/data-deletion">سياسة حذف البيانات</a>)</li>
              <li><strong>الاعتراض:</strong> الاعتراض على معالجة معينة لبياناتك</li>
              <li><strong>النقل:</strong> الحصول على بياناتك بتنسيق قابل للقراءة آليًا</li>
            </ul>
          </div>

          <div class="section">
            <h2>الاحتفاظ بالبيانات</h2>
            <p>
              نحتفظببياناتك طالما كان حسابك نشطًا أو حسب الحاجة لتقديم الخدمات. قد نحتفظ ببعض البيانات لفترة أطول للامتثال للمتطلبات القانونية أو أغراض الأرشفة.
            </p>
          </div>

          <div class="section">
            <h2>خصوصية الأطفال</h2>
            <p>
              تطبيقنا مخصص للاستخدام التعليمي. بالنسبة للمستخدمين الذين تقل أعمارهم عن 18 عامًا، نطلب موافقة ولي الأمر. 
              نلتزم بحماية خصوصية الأطفال ولا نجمع بيانات أكثر من اللازم.
            </p>
          </div>

          <div class="section">
            <h2>ملفات تعريف الارتباط والتقنيات المشابهة</h2>
            <p>
              نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتحسين تجربتك، والحفاظ على جلستك، وتحليل استخدام التطبيق.
            </p>
          </div>

          <div class="section">
            <h2>التغييرات على سياسة الخصوصية</h2>
            <p>
              قد نحدث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار في التطبيق.
            </p>
          </div>

          <div class="section">
            <h2>اتصل بنا</h2>
            <p>إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا:</p>
            <ul class="contact-info">
              <li><strong>البريد الإلكتروني:</strong> privacy&#64;swiftmind.com</li>
              <li><strong>الدعم:</strong> support&#64;swiftmind.com</li>
            </ul>
          </div>

        } @else {
          <!-- English Version -->
          <h1>Privacy Policy</h1>
          <p class="last-updated">Last Updated: March 12, 2026</p>

          <div class="section">
            <h2>Introduction</h2>
            <p>
              Welcome to <strong>KAI (SwiftMind Sesha)</strong>. We are committed to protecting your privacy and personal data. 
              This Privacy Policy explains how we collect, use, protect, and share your information when you use our educational application.
            </p>
          </div>

          <div class="section">
            <h2>Information We Collect</h2>
            <h3>Account Information</h3>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Role (Student, Teacher, Parent, Admin)</li>
              <li>Profile picture (optional)</li>
            </ul>

            <h3>Social Login Information</h3>
            <p>When you sign in using Google or Facebook, we collect:</p>
            <ul>
              <li>Platform-specific user ID</li>
              <li>Name and email address</li>
              <li>Profile picture (if available)</li>
            </ul>

            <h3>Academic Data</h3>
            <ul>
              <li>Attendance and absence records</li>
              <li>Grades and exam results</li>
              <li>Course enrollments</li>
              <li>Interactions with teachers and students</li>
            </ul>

            <h3>Technical Data</h3>
            <ul>
              <li>IP address</li>
              <li>Device type and operating system</li>
              <li>Unique device identifier</li>
              <li>App logs and error reports</li>
            </ul>
          </div>

          <div class="section">
            <h2>How We Use Your Information</h2>
            <ul>
              <li>Provide and improve our educational services</li>
              <li>Manage your account and authentication</li>
              <li>Communicate with you about updates and notifications</li>
              <li>Track academic performance and attendance</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </div>

          <div class="section">
            <h2>Data Sharing</h2>
            <p>We do not sell your personal data. We may share information with:</p>
            <ul>
              <li><strong>Teachers and Parents:</strong> For legitimate academic purposes</li>
              <li><strong>Service Providers:</strong> Who help operate the app (hosting, analytics)</li>
              <li><strong>Legal Authorities:</strong> When required to comply with laws</li>
            </ul>
          </div>

          <div class="section">
            <h2>Facebook & Google Login</h2>
            <p>
              When you use Facebook or Google login, we only obtain basic information (name, email, ID). 
              We do not access any other data from your accounts on these platforms. You can revoke this access anytime through your Facebook or Google account settings.
            </p>
          </div>

          <div class="section">
            <h2>Data Security</h2>
            <p>We use advanced security measures to protect your data:</p>
            <ul>
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest</li>
              <li>Secure authentication (OAuth 2.0)</li>
              <li>Role-based access control</li>
              <li>Regular security monitoring</li>
            </ul>
          </div>

          <div class="section">
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct any inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (see <a routerLink="/data-deletion">Data Deletion Policy</a>)</li>
              <li><strong>Object:</strong> Object to certain processing of your data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            </ul>
          </div>

          <div class="section">
            <h2>Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. We may retain some data for longer periods to comply with legal requirements or archival purposes.
            </p>
          </div>

          <div class="section">
            <h2>Children's Privacy</h2>
            <p>
              Our app is designed for educational use. For users under 18 years old, we require parental consent. 
              We are committed to protecting children's privacy and do not collect more data than necessary.
            </p>
          </div>

          <div class="section">
            <h2>Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, maintain your session, and analyze app usage.
            </p>
          </div>

          <div class="section">
            <h2>Changes to Privacy Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of any material changes via email or through an in-app notification.
            </p>
          </div>

          <div class="section">
            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul class="contact-info">
              <li><strong>Email:</strong> privacy&#64;swiftmind.com</li>
              <li><strong>Support:</strong> support&#64;swiftmind.com</li>
            </ul>
          </div>
        }

        <div class="back-link">
          <a routerLink="/login">{{ isArabic ? '← العودة إلى تسجيل الدخول' : '← Back to Login' }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .privacy-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 900px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      margin: 20px;
      position: relative;
    }

    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 32px;
      font-weight: 600;
    }

    h2 {
      color: #764ba2;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 24px;
      font-weight: 600;
    }

    h3 {
      color: #667eea;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: 600;
    }

    .last-updated {
      color: #666;
      font-size: 14px;
      font-style: italic;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .section {
      margin-bottom: 30px;
    }

    p {
      color: #333;
      line-height: 1.8;
      margin-bottom: 15px;
    }

    ul {
      color: #333;
      line-height: 1.8;
      margin-bottom: 20px;
      padding-left: 25px;
    }

    li {
      margin-bottom: 10px;
    }

    strong {
      color: #667eea;
      font-weight: 600;
    }

    a {
      color: #667eea;
      text-decoration: underline;
    }

    a:hover {
      color: #764ba2;
    }

    .contact-info {
      list-style: none;
      padding-left: 0;
    }

    .contact-info li {
      padding: 8px 0;
    }

    .back-link {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .back-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }

    .back-link a:hover {
      color: #764ba2;
    }

    .lang-toggle {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    }

    .lang-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
    }

    .lang-btn:hover {
      background: #764ba2;
    }

    @media (max-width: 768px) {
      .container {
        padding: 20px;
        margin: 10px;
      }

      h1 {
        font-size: 26px;
      }

      h2 {
        font-size: 20px;
      }

      h3 {
        font-size: 16px;
      }

      .lang-toggle {
        top: 10px;
        right: 10px;
      }
    }
  `]
})
export class PrivacyPolicyComponent {
  isArabic = signal(true);

  toggleLanguage(): void {
    this.isArabic.update(val => !val);
  }
}
