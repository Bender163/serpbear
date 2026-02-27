import Icon from '../common/Icon';

type KeywordPositionProps = {
   position: number,
   updating?: boolean,
   type?: string,
}

const KeywordPosition = ({ position = 0, type = '', updating = false }:KeywordPositionProps) => {
   if (!updating && position === 0) {
      return <span className='text-gray-400' title='Не в ТОП-100'>{'>100'}</span>;
   }
   if (updating && type !== 'sc') {
      return <span title='Обновление позиции'><Icon type="loading" /></span>;
   }
   return <>{Math.round(position)}</>;
};

export default KeywordPosition;
