/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { Component } from "react";
import { Global, css } from "@emotion/core";
import { Helmet } from "react-helmet";

const Layout = ({ children, title }) => (
	<>
		<Global
			styles={{
				body: {
					margin: 0,
					width: "100%"
				},
				".container": {
					margin: "0 auto",
					"max-width": "960px",
					width: "100%"
				},
				"h1, h2, h3, h4": {
					margin: 0
				},
				// ul: {
				// 	margin: 0,
				// 	padding: 0
				// }
			}}
		/>
		<Helmet defaultTitle="FUN! YAOI!" titleTemplate="%s | FUN! YAOI!">
			<html dir="rtl" lang="ar" />
			<meta charSet="utf-8" />
		</Helmet>
		<header
			css={{
				backgroundColor: "black",
				padding: "10px",
			}}
		>
			<h1 class="container">
				<a css={{
									"text-decoration": "none",
					color: "White"
				}} href="/">FUN! YAOI</a>
			</h1>
		</header>
		<main class="container">{children}</main>
	</>
);

export default Layout;
