import React from 'react';
import { useClearFailedQueue } from '../../services/settings';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import SecretField from '../common/SecretField';
import ToggleField from '../common/ToggleField';

type ScraperSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const ScraperSettings = ({ settings, settingsError, updateSettings }:ScraperSettingsProps) => {
   const { mutate: clearFailedMutate, isLoading: clearingQueue } = useClearFailedQueue(() => {});

   const scrapingOptions: SelectionOption[] = [
      { label: 'Ежедневно', value: 'daily' },
      { label: 'Через день', value: 'other_day' },
      { label: 'Еженедельно', value: 'weekly' },
      { label: 'Ежемесячно', value: 'monthly' },
      { label: 'Никогда', value: 'never' },
   ];
   const delayOptions: SelectionOption[] = [
      { label: 'Без задержки', value: '0' },
      { label: '5 секунд', value: '5000' },
      { label: '10 секунд', value: '10000' },
      { label: '30 секунд', value: '30000' },
      { label: '1 минута', value: '60000' },
      { label: '2 минуты', value: '120000' },
      { label: '5 минут', value: '300000' },
      { label: '10 минут', value: '600000' },
      { label: '15 минут', value: '900000' },
      { label: '30 минут', value: '1800000' },
   ];
   const allScrapers: SelectionOption[] = settings.available_scapers ? settings.available_scapers : [];
   const scraperOptions: SelectionOption[] = [{ label: 'Не выбран', value: 'none' }, ...allScrapers];
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
      <div className='settings__content styled-scrollbar p-6 text-sm'>

         <div className="settings__section__select mb-5">
            <SelectField
            label='Метод сбора'
            options={scraperOptions}
            selected={[settings.scraper_type || 'none']}
            defaultLabel="Выберите сервис"
            updateField={(updatedTime:[string]) => updateSettings('scraper_type', updatedTime[0])}
            multiple={false}
            rounded={'rounded'}
            minWidth={220}
            />
         </div>
         {settings.scraper_type !== 'none' && settings.scraper_type !== 'proxy' && (
            <div className="settings__section__secret mb-5">
               <SecretField
               label='API-ключ или токен'
               placeholder={'API-ключ/Токен'}
               value={settings?.scaping_api || ''}
               hasError={settingsError?.type === 'no_api_key'}
               onChange={(value:string) => updateSettings('scaping_api', value)}
               />
            </div>
         )}
         {settings.scraper_type === 'proxy' && (
            <div className="settings__section__input mb-5">
               <label className={labelStyle}>Список прокси</label>
               <textarea
                  className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                  focus:outline-none min-h-[160px] focus:border-blue-200 
                  ${settingsError?.type === 'no_email' ? ' border-red-400 focus:border-red-400' : ''} `}
                  value={settings?.proxy}
                  placeholder={'http://122.123.22.45:5049\nhttps://user:password@122.123.22.45:5049'}
                  onChange={(event) => updateSettings('proxy', event.target.value)}
               />
            </div>
         )}
         {settings.scraper_type !== 'none' && (
            <div className="settings__section__input mb-5">
               <SelectField
                  label='Частота сбора'
                  multiple={false}
                  selected={[settings?.scrape_interval || 'daily']}
                  options={scrapingOptions}
                  defaultLabel={'Настройки частоты'}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_interval', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>Для вступления в силу требуется перезапуск сервера/Docker.</small>
            </div>
         )}
            <div className="settings__section__input mb-5">
               <SelectField
                  label='Задержка между запросами'
                  multiple={false}
                  selected={[settings?.scrape_delay || '0']}
                  options={delayOptions}
                  defaultLabel={'Настройки задержки'}
                  updateField={(updated:string[]) => updated[0] && updateSettings('scrape_delay', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
               <small className=' text-gray-500 pt-2 block'>Для вступления в силу требуется перезапуск сервера/Docker.</small>
            </div>
            <div className="settings__section__input mb-5">
               <ToggleField
               label='Автоповтор неудачных запросов'
               value={!!settings?.scrape_retry }
               onChange={(val) => updateSettings('scrape_retry', val)}
               />
            </div>
            {settings?.scrape_retry && (settings.failed_queue?.length || 0) > 0 && (
               <div className="settings__section__input mb-5">
                  <label className={labelStyle}>Очистить очередь неудачных</label>
                  <button
                  onClick={() => clearFailedMutate()}
                  className=' py-3 px-5 w-full rounded cursor-pointer bg-gray-100 text-gray-800
                  font-semibold text-sm hover:bg-gray-200'>
                     {clearingQueue && <Icon type="loading" size={14} />} Очистить очередь
                       ({settings.failed_queue?.length || 0} ключевиков)
                  </button>
               </div>
            )}
      </div>
   </div>
   );
};

export default ScraperSettings;
