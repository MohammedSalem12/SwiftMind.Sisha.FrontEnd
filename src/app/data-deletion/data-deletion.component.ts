import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-data-deletion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="deletion-page">
      <div class="container">
        <!-- Language Toggle -->
        <div class="lang-toggle">
          <button (click)="toggleLanguage()" class="lang-btn">
            {{ isArabic ? 'English' : 'العربية' }}
          </button>
        </div>

        @if (isArabic) {
          <!-- Arabic Version -->
          <h1>تعليمات حذف البيانات</h1>
          <p>
            في <strong>KAI (سويفت مايند سيشا)</strong>، نقدر خصوصيتك ونوفر لك التحكم الكامل في بياناتك. 
            وفقًا لقواعد منصة فيسبوك، نوفر خيارات شاملة لحذف بيانات المستخدم.
          </p>
          
          <h3>كيفية حذف بياناتك عبر فيسبوك:</h3>
          <ol>
            <li>انتقل إلى قائمة <strong>الإعدادات والخصوصية</strong> في ملفك الشخصي على فيسبوك.</li>
            <li>انقر على <strong>الإعدادات</strong>.</li>
            <li>قم بالتمرير لأسفل وانقر على <strong>التطبيقات والمواقع الإلكترونية</strong>.</li>
            <li>ابحث عن <strong>KAI</strong> أو <strong>سويفت مايند سيشا</strong> وانقر عليه.</li>
            <li>انقر على زر <strong>إزالة</strong>.</li>
          </ol>

          <h3>طلب حذف البيانات يدويًا:</h3>
          <p>إذا كنت ترغب في حذف بيانات حسابك من قاعدة بياناتنا، يرجى اتباع الخطوات التالية:</p>
          <ul>
            <li>أرسل بريدًا إلكترونيًا إلى: <strong>support&#64;swiftmind.com</strong></li>
            <li>الموضوع: <strong>طلب حذف البيانات</strong></li>
            <li>قم بتضمين: <strong>معرف مستخدم فيسبوك</strong> أو <strong>عنوان البريد الإلكتروني</strong> المرتبط بحسابك.</li>
          </ul>
          <p>
            سنقوم بمعالجة طلبك وحذف جميع البيانات المرتبطة خلال <strong>30 يومًا</strong>. 
            ستتلقى بريدًا إلكترونيًا للتأكيد بمجرد اكتمال العملية.
          </p>

          <h3>ما هي البيانات التي نحذفها:</h3>
          <ul>
            <li>معلومات ملفك الشخصي (الاسم، البريد الإلكتروني، معرف فيسبوك)</li>
            <li>أي سجلات أكاديمية مرتبطة بحسابك</li>
            <li>رموز المصادقة وبيانات الجلسة</li>
            <li>جميع البيانات الشخصية المخزنة في أنظمتنا</li>
          </ul>
        } @else {
          <!-- English Version -->
          <h1>Data Deletion Instructions</h1>
          <p>
            At <strong>KAI (SwiftMind Sesha)</strong>, we value your privacy and provide you with full control over your data. 
            According to Facebook's Platform Rules, we provide comprehensive User Data Deletion options.
          </p>
          
          <h3>How to Delete Your Data via Facebook:</h3>
          <ol>
            <li>Go to your Facebook Profile's <strong>Settings & Privacy</strong> menu.</li>
            <li>Click <strong>Settings</strong>.</li>
            <li>Scroll down and click <strong>Apps and Websites</strong>.</li>
            <li>Find and click on <strong>KAI</strong> or <strong>SwiftMind Sesha</strong>.</li>
            <li>Click the <strong>Remove</strong> button.</li>
          </ol>

          <h3>Manual Data Deletion Request:</h3>
          <p>If you wish to delete your specific user account data from our database, please follow these steps:</p>
          <ul>
            <li>Send an email to: <strong>support&#64;swiftmind.com</strong></li>
            <li>Subject: <strong>Data Deletion Request</strong></li>
            <li>Include your: <strong>Facebook User ID</strong> or the <strong>Email Address</strong> associated with your account.</li>
          </ul>
          <p>
            We will process your request and delete all associated data within <strong>30 days</strong>. 
            You will receive a confirmation email once the process is complete.
          </p>

          <h3>What Data We Delete:</h3>
          <ul>
            <li>Your profile information (name, email, Facebook ID)</li>
            <li>Any academic records associated with your account</li>
            <li>Authentication tokens and session data</li>
            <li>All personal data stored in our systems</li>
          </ul>
        }

        <div class="back-link">
          <a routerLink="/login">{{ isArabic ? '← العودة إلى تسجيل الدخول' : '← Back to Login' }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .deletion-page {
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
      max-width: 800px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      margin: 20px;
      position: relative;
    }

    h1 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 28px;
      font-weight: 600;
    }

    h3 {
      color: #764ba2;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 20px;
      font-weight: 600;
    }

    p {
      color: #333;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    ol, ul {
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
        font-size: 24px;
      }

      h3 {
        font-size: 18px;
      }

      .lang-toggle {
        top: 10px;
        right: 10px;
      }
    }
  `]
})
export class DataDeletionComponent {
  isArabic = signal(true);

  toggleLanguage(): void {
    this.isArabic.update(val => !val);
  }
}
