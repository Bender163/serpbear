import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Icon from '../../components/common/Icon';

type LoginError = {
   type: string,
   msg: string,
}

const Login: NextPage = () => {
   const [error, setError] = useState<LoginError|null>(null);
   const [username, setUsername] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const router = useRouter();

   // Auto-redirect if already authenticated (e.g. via mos_token cookie)
   useEffect(() => {
      fetch(`${window.location.origin}/api/domains`, { credentials: 'include' })
         .then((res) => {
            if (res.ok) {
               router.push('/domains');
            }
         })
         .catch(() => { /* Not authenticated, stay on login page */ });
   }, [router]);

   const loginuser = async () => {
      let loginError: LoginError |null = null;
      if (!username || !password) {
         if (!username && !password) {
            loginError = { type: 'empty_username_password', msg: 'Введите логин и пароль для входа.' };
         }
         if (!username && password) {
            loginError = { type: 'empty_username', msg: 'Введите логин' };
         }
         if (!password && username) {
            loginError = { type: 'empty_password', msg: 'Введите пароль' };
         }
         setError(loginError);
         setTimeout(() => { setError(null); }, 3000);
      } else {
         try {
            const header = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
            const fetchOpts = { method: 'POST', headers: header, body: JSON.stringify({ username, password }) };
            const fetchRoute = `${window.location.origin}/api/login`;
            const res = await fetch(fetchRoute, fetchOpts).then((result) => result.json());
            // console.log(res);
            if (!res.success) {
               let errorType = '';
               if (res.error && res.error.toLowerCase().includes('username')) {
                   errorType = 'incorrect_username';
               }
               if (res.error && res.error.toLowerCase().includes('password')) {
                   errorType = 'incorrect_password';
               }
               setError({ type: errorType, msg: res.error });
               setTimeout(() => { setError(null); }, 3000);
            } else {
               router.push('/');
            }
         } catch (fetchError) {
            setError({ type: 'unknown', msg: 'Не удалось войти. Сервер не отвечает.' });
            setTimeout(() => { setError(null); }, 3000);
         }
      }
   };

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700';
   // eslint-disable-next-line max-len
   const inputStyle = 'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none focus:border-blue-200';
   const errorBorderStyle = 'border-red-400 focus:border-red-400';
   return (
      <div className={'Login'}>
         <Head>
            <title>Вход — SERP Трекер</title>
         </Head>
         <div className='flex items-center justify-center w-full h-screen'>
            <div className='w-80 mt-[-300px]'>
               <h3 className="py-7 text-2xl font-bold text-blue-700 text-center">
                  <span className=' relative top-[3px] mr-1'>
                  </span> 📊 SERP Трекер
               </h3>
               <div className='relative bg-[white] rounded-md text-sm border p-5'>
                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>Логин</label>
                     <input
                        className={`
                           ${inputStyle} 
                           ${error && error.type.includes('username') ? errorBorderStyle : ''} 
                        `}
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>Пароль</label>
                     <input
                        className={`
                           ${inputStyle} 
                           ${error && error.type.includes('password') ? errorBorderStyle : ''} 
                        `}
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                     />
                  </div>
                  <button
                  onClick={() => loginuser()}
                  className={'py-3 px-5 w-full rounded cursor-pointer bg-blue-700 text-white font-semibold text-sm'}>
                     Войти
                  </button>
                  {error && error.msg
                  && <div
                     className={'absolute w-full bottom-[-100px] ml-[-20px] rounded text-center p-3 bg-red-100 text-red-600 text-sm font-semibold'}>
                        {error.msg}
                     </div>
                  }
               </div>
            </div>
         </div>

      </div>
   );
};

export default Login;
