import React from 'react';
import SelectField from '../common/SelectField';
import SecretField from '../common/SecretField';
import InputField from '../common/InputField';

type NotificationSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const NotificationSettings = ({ settings, settingsError, updateSettings }:NotificationSettingsProps) => {
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
         <div className='settings__content styled-scrollbar p-6 text-sm'>
            <div className="settings__section__input mb-5">
               <SelectField
               label='Частота уведомлений'
                  multiple={false}
                  selected={[settings.notification_interval]}
                  options={[
                     { label: 'Ежедневно', value: 'daily' },
                     { label: 'Еженедельно', value: 'weekly' },
                     { label: 'Ежемесячно', value: 'monthly' },
                     { label: 'Никогда', value: 'never' },
                  ]}
                  defaultLabel={'Настройки уведомлений'}
                  updateField={(updated:string[]) => updated[0] && updateSettings('notification_interval', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
            </div>
            {settings.notification_interval !== 'never' && (
               <>
                  <div className="settings__section__input mb-5">
                     <InputField
                     label='Email для уведомлений'
                     hasError={settingsError?.type === 'no_email'}
                     value={settings?.notification_email}
                     placeholder={'test@gmail.com, test2@test.com'}
                     onChange={(value:string) => updateSettings('notification_email', value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                     label='SMTP-сервер'
                     hasError={settingsError?.type === 'no_smtp_server'}
                     value={settings?.smtp_server || ''}
                     placeholder={'test@gmail.com, test2@test.com'}
                     onChange={(value:string) => updateSettings('smtp_server', value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                     label='SMTP-порт'
                     hasError={settingsError?.type === 'no_smtp_port'}
                     value={settings?.smtp_port || ''}
                     placeholder={'2234'}
                     onChange={(value:string) => updateSettings('smtp_port', value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                        label='SMTP логин'
                        hasError={settingsError?.type === 'no_smtp_port'}
                        value={settings?.smtp_username || ''}
                        onChange={(value:string) => updateSettings('smtp_username', value)}
                        />
                  </div>
                  <div className="settings__section__input mb-5">
                     <SecretField
                     label='SMTP пароль'
                     value={settings?.smtp_password || ''}
                     onChange={(value:string) => updateSettings('smtp_password', value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                        <InputField
                        label='Email отправителя'
                        hasError={settingsError?.type === 'no_smtp_from'}
                        value={settings?.notification_email_from || ''}
                        placeholder="no-reply@mydomain.com"
                        onChange={(value:string) => updateSettings('notification_email_from', value)}
                        />
                  </div>
                  <div className="settings__section__input mb-5">
                        <InputField
                        label='Имя отправителя'
                        hasError={settingsError?.type === 'no_smtp_from'}
                        value={settings?.notification_email_from_name || 'SERP Трекер'}
                        placeholder="SERP Трекер"
                        onChange={(value:string) => updateSettings('notification_email_from_name', value)}
                        />
                  </div>
               </>
            )}

            </div>
            {settingsError?.msg && (
               <div className='absolute w-full bottom-16  text-center p-3 bg-red-100 text-red-600 text-sm font-semibold'>
                  {settingsError.msg}
               </div>
            )}
      </div>
   );
};

export default NotificationSettings;
