import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 기본적으로 다크모드 베이스의 디자인
  theme: {
    extend: {
      colors: {
        // 배경 및 기본 색상 (딥 퍼플 베이스)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        
        // 메인 브랜드 컬러 (트렌디한 비비드 블루/퍼플)
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          foreground: '#ffffff',
          hover: '#4338CA', // Indigo 700
          light: '#818CF8', // Indigo 400
        },
        
        // 서브 포인트 컬러 (트렌디한 코랄 핑크)
        secondary: {
          DEFAULT: '#F43F5E', // Rose 500
          foreground: '#ffffff',
          hover: '#E11D48', // Rose 600
        },
        
        // 치지직 그린 포인트 (흰 글씨 가독성 확보 위해 한 단계 어둡게)
        accent: {
          DEFAULT: '#00876A',
          foreground: '#ffffff',
          hover: '#006B53',
        },
        
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        
        // 라이브 빨간색
        live: '#FF3B30',
        
        // 게이밍 무드 추가 색상
        neon: {
          blue: '#4DFFFF',
          purple: '#B026FF',
          pink: '#FF00A0',
        }
      },
      borderRadius: {
        xl: '1rem',
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        // 타이틀용 특별한 폰트가 필요하다면 여기에 추가
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'text-gradient': 'linear-gradient(to right, #818CF8, #F43F5E)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(176, 38, 255, 0.2), 0 0 10px rgba(176, 38, 255, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(176, 38, 255, 0.6), 0 0 20px rgba(176, 38, 255, 0.4)' },
        }
      },
    },
  },
  plugins: [],
};

export default config;
