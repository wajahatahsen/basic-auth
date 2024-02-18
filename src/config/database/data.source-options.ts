import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mongodb',
  host: process.env.DB_HOST || 'localhost',
  port: +process.env.DB_PORT || 27017,
  database: process.env.DB_NAME || 'test',
  entities: ['dist/**/*.entity.js'],
  synchronize: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
