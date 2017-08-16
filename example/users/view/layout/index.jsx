import React from 'react'
import { Layout, Menu, Breadcrumb } from 'antd';
import './index.css';

const { Header, Content, Footer } = Layout;

export default ({children})=>{
  return (
    <Layout>
    <Header style={{ position: 'fixed', width: '100%' }}>
      <div className="logo" />
    </Header>
    <Content style={{ padding: '0 50px', marginTop: 94 }}>
      <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
        {children}
      </div>
    </Content>
  </Layout>
  )
};
