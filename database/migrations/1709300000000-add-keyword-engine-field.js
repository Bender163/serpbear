'use strict';

module.exports = {
   up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition && !keywordTableDefinition.engine) {
               await queryInterface.addColumn('keyword', 'engine', {
                  type: Sequelize.DataTypes.STRING,
                  allowNull: true,
                  defaultValue: null,
               }, { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            if (keywordTableDefinition && keywordTableDefinition.engine) {
               await queryInterface.removeColumn('keyword', 'engine', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
