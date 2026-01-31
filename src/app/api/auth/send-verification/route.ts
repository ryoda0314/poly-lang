import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const templates: Record<string, { subject: string; body: (url: string) => string }> = {
    en: {
        subject: "Welcome to PolyLinga!",
        body: (url: string) => `
            <h2>Welcome to PolyLinga!</h2>
            <p>Thank you for joining PolyLinga – your new language learning companion.</p>
            <p>You're just one step away from starting your language journey. Click the link below to verify your email address and activate your account:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">Verify Email Address</a></p>
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>Mark words you discover and review them with spaced repetition</li>
                <li>Learn real phrases with native audio playback</li>
                <li>Get AI-powered writing corrections and grammar explanations</li>
                <li>Track your progress with levels, streaks, and rewards</li>
            </ul>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Happy learning!<br>The PolyLinga Team</p>
        `,
    },
    ja: {
        subject: "PolyLingaへようこそ！",
        body: (url: string) => `
            <h2>PolyLingaへようこそ！</h2>
            <p>PolyLingaにご登録いただきありがとうございます。</p>
            <p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">メールアドレスを確認する</a></p>
            <p>確認が完了すると、以下の機能をご利用いただけます：</p>
            <ul>
                <li>気になった単語をマークして間隔反復で復習</li>
                <li>ネイティブ音声付きのリアルなフレーズ学習</li>
                <li>AIによる添削と文法解説</li>
                <li>レベル・ストリーク・リワードで進捗管理</li>
            </ul>
            <p>このメールに心当たりがない場合は、無視していただいて問題ありません。</p>
            <p>PolyLingaチーム</p>
        `,
    },
    ko: {
        subject: "PolyLinga에 오신 것을 환영합니다!",
        body: (url: string) => `
            <h2>PolyLinga에 오신 것을 환영합니다!</h2>
            <p>PolyLinga에 가입해 주셔서 감사합니다.</p>
            <p>아래 버튼을 클릭하여 이메일 주소를 인증해 주세요:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">이메일 인증하기</a></p>
            <p>인증이 완료되면 다음 기능을 이용하실 수 있습니다:</p>
            <ul>
                <li>발견한 단어를 표시하고 간격 반복으로 복습</li>
                <li>원어민 음성이 포함된 실용 문장 학습</li>
                <li>AI 첨삭 및 문법 설명</li>
                <li>레벨, 스트릭, 리워드로 학습 진도 관리</li>
            </ul>
            <p>본인이 가입하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
            <p>PolyLinga 팀</p>
        `,
    },
    zh: {
        subject: "欢迎来到 PolyLinga！",
        body: (url: string) => `
            <h2>欢迎来到 PolyLinga！</h2>
            <p>感谢您注册 PolyLinga。</p>
            <p>请点击下方按钮验证您的邮箱地址：</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">验证邮箱</a></p>
            <p>验证完成后，您可以使用以下功能：</p>
            <ul>
                <li>标记发现的单词并通过间隔重复复习</li>
                <li>学习配有母语音频的实用短语</li>
                <li>AI写作批改和语法讲解</li>
                <li>通过等级、连续学习天数和奖励追踪进度</li>
            </ul>
            <p>如果您没有注册账户，请忽略此邮件。</p>
            <p>PolyLinga 团队</p>
        `,
    },
    fr: {
        subject: "Bienvenue sur PolyLinga !",
        body: (url: string) => `
            <h2>Bienvenue sur PolyLinga !</h2>
            <p>Merci de vous être inscrit sur PolyLinga.</p>
            <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail :</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">Vérifier l'adresse e-mail</a></p>
            <p>Une fois vérifié, vous pourrez :</p>
            <ul>
                <li>Marquer les mots découverts et les réviser par répétition espacée</li>
                <li>Apprendre des phrases authentiques avec audio natif</li>
                <li>Obtenir des corrections et explications grammaticales par IA</li>
                <li>Suivre vos progrès avec niveaux, séries et récompenses</li>
            </ul>
            <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.</p>
            <p>L'équipe PolyLinga</p>
        `,
    },
    es: {
        subject: "¡Bienvenido a PolyLinga!",
        body: (url: string) => `
            <h2>¡Bienvenido a PolyLinga!</h2>
            <p>Gracias por registrarte en PolyLinga.</p>
            <p>Haz clic en el botón de abajo para verificar tu dirección de correo electrónico:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">Verificar correo electrónico</a></p>
            <p>Una vez verificado, podrás:</p>
            <ul>
                <li>Marcar palabras descubiertas y repasarlas con repetición espaciada</li>
                <li>Aprender frases reales con audio nativo</li>
                <li>Obtener correcciones y explicaciones gramaticales con IA</li>
                <li>Seguir tu progreso con niveles, rachas y recompensas</li>
            </ul>
            <p>Si no creaste una cuenta, puedes ignorar este correo.</p>
            <p>El equipo de PolyLinga</p>
        `,
    },
    de: {
        subject: "Willkommen bei PolyLinga!",
        body: (url: string) => `
            <h2>Willkommen bei PolyLinga!</h2>
            <p>Vielen Dank für Ihre Registrierung bei PolyLinga.</p>
            <p>Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">E-Mail-Adresse bestätigen</a></p>
            <p>Nach der Bestätigung können Sie:</p>
            <ul>
                <li>Entdeckte Wörter markieren und mit Spaced Repetition wiederholen</li>
                <li>Echte Phrasen mit Muttersprachler-Audio lernen</li>
                <li>KI-gestützte Korrekturen und Grammatikerklärungen erhalten</li>
                <li>Ihren Fortschritt mit Levels, Streaks und Belohnungen verfolgen</li>
            </ul>
            <p>Wenn Sie kein Konto erstellt haben, können Sie diese E-Mail ignorieren.</p>
            <p>Das PolyLinga-Team</p>
        `,
    },
    ru: {
        subject: "Добро пожаловать в PolyLinga!",
        body: (url: string) => `
            <h2>Добро пожаловать в PolyLinga!</h2>
            <p>Спасибо за регистрацию в PolyLinga.</p>
            <p>Нажмите на кнопку ниже, чтобы подтвердить свой адрес электронной почты:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">Подтвердить email</a></p>
            <p>После подтверждения вы сможете:</p>
            <ul>
                <li>Отмечать новые слова и повторять их с интервальным повторением</li>
                <li>Изучать реальные фразы с озвучкой носителей языка</li>
                <li>Получать исправления и объяснения грамматики от ИИ</li>
                <li>Отслеживать прогресс с уровнями, сериями и наградами</li>
            </ul>
            <p>Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>
            <p>Команда PolyLinga</p>
        `,
    },
    vi: {
        subject: "Chào mừng đến với PolyLinga!",
        body: (url: string) => `
            <h2>Chào mừng đến với PolyLinga!</h2>
            <p>Cảm ơn bạn đã đăng ký PolyLinga.</p>
            <p>Nhấp vào nút bên dưới để xác minh địa chỉ email của bạn:</p>
            <p><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">Xác minh email</a></p>
            <p>Sau khi xác minh, bạn có thể:</p>
            <ul>
                <li>Đánh dấu từ mới và ôn tập bằng lặp lại ngắt quãng</li>
                <li>Học các cụm từ thực tế với âm thanh bản ngữ</li>
                <li>Nhận chỉnh sửa và giải thích ngữ pháp từ AI</li>
                <li>Theo dõi tiến trình với cấp độ, chuỗi ngày và phần thưởng</li>
            </ul>
            <p>Nếu bạn không tạo tài khoản, bạn có thể bỏ qua email này.</p>
            <p>Đội ngũ PolyLinga</p>
        `,
    },
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, native_language } = body;

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Generate signup confirmation link using Supabase Admin API
        // This confirms the user's email address when clicked
        const { data, error } = await supabase.auth.admin.generateLink({
            type: "signup",
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
            },
        });

        if (error || !data?.properties?.action_link) {
            console.error("Generate link error:", error);
            return NextResponse.json({ error: "Failed to generate verification link" }, { status: 500 });
        }

        const verificationUrl = data.properties.action_link;

        // Get template based on native language
        const lang = native_language && templates[native_language] ? native_language : "en";
        const template = templates[lang];

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
            from: "PolyLinga <no-reply@polylinga.app>",
            to: email,
            subject: template.subject,
            html: template.body(verificationUrl),
        });

        if (emailError) {
            console.error("Resend error:", emailError);
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        console.error("API Route Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}