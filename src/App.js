import React from "react";
import { Router, Link, Location, Redirect , redirectTo, navigate} from "@reach/router";
import Layout from "./layout";
import axios from "axios";
import fs from "fs";
import logo from "./logo.svg";
import "./App.css";
import ReactGA from "react-ga";
import { Helmet } from "react-helmet";
import { Global, css } from "@emotion/core";
import Autosuggest from "react-autosuggest";
import AutosuggestHighlightMatch from "autosuggest-highlight/umd/match";
import AutosuggestHighlightParse from "autosuggest-highlight/umd/parse";

function escapeRegexCharacters(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getSuggestions(value) {
	const escapedValue = escapeRegexCharacters(value.trim());

	if (value === "" || value.length < 3) {
		return [];
	}
	const { data } = await axios(
		`https://unmarred-utahceratops.glitch.me/search/${value}`
	);
	const regex = new RegExp("^" + escapedValue, "i");
	return data;
	// return languages.filter(language => regex.test(language.name));
}

function getSuggestionValue(suggestion) {
	// return suggestion.name;
	return suggestion.title;
}

function renderSuggestion(suggestion, { query }) {
	const matches = AutosuggestHighlightMatch(suggestion.title, query);
	const parts = AutosuggestHighlightParse(suggestion.title, matches);
	return (
		<span>
			<Link to={suggestion._id}>
				<img
					src={suggestion.img}
					width="54px"
					height="74px"
					style={{ "object-fit": "cover" }}
				/>
				{parts.map((part, index) => {
					const className = part.highlight
						? "react-autosuggest__suggestion-match"
						: null;

					return (
						<span className={className} key={index}>
							{part.text}
						</span>
					);
				})}
			</Link>
		</span>
	);
}

class Search extends React.Component {
	constructor() {
		super();

		this.state = {
			value: "",
			suggestions: []
		};
	}

	onChange = (event, { newValue, method }) => {
		this.setState({
			value: newValue
		});
	};

	onSuggestionsFetchRequested = async ({ value }) => {
		this.setState({
			suggestions: await getSuggestions(value)
		});
	};

	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: []
		});
	};

	render() {
		const { value, suggestions } = this.state;
		const inputProps = {
			placeholder: "اكتبي عنوان المانجا هنا لتبحثي عنها بسرعة",
			value,
			onChange: this.onChange
		};

		return (
			<div style={{margin: "20px 0"}}>
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				getSuggestionValue={getSuggestionValue}
				renderSuggestion={renderSuggestion}
				inputProps={inputProps}
				onSuggestionSelected={(event, { suggestion }) => {

					navigate(suggestion._id);
					this.setState({value: ''})
				}}
			/>
			</div>
		);
	}
}

ReactGA.initialize("UA-152416558-1"); // Here we should use our GA id

class Edit extends React.Component {
	constructor(props) {
		super(props);
		this.state = { data: {} };
	}

	async componentDidMount() {
		const { data } = await axios(
			`https://unmarred-utahceratops.glitch.me/manga/${this.props.id}`
		);

		// save value of last
		let arr = localStorage.getItem("history") ? JSON.parse(localStorage.getItem("history")) : [];
		let bol = arr.some(item => item.title === data.title)
		
		if (!bol) arr.unshift(data)
		if(arr.length > 10) arr.length = 10;

		localStorage.setItem('history',JSON.stringify(arr));
		this.setState({ data });
	}

	async componentDidUpdate(prevProps) {
		if (this.props.id !== prevProps.id) {
			const { data } = await axios(
				`https://unmarred-utahceratops.glitch.me/manga/${this.props.id}`
			);
			this.setState({ data });
		}
	}

	render() {
		const { data } = this.state;
		return (
			<div>
				<Helmet>
					<title>{data.title}</title>
				</Helmet>
				<img src={data.img} style={{ maxWidth: "100%" }} />
				<div>
					عنوان المانجا
					<input type="text" value={data.title} name="title" />
				</div>
				<div>عدد الفصول: <input type="number"  name="ch_number" value={data.ch_number}/></div>
				<div>عدد المجلدات: <input type="number" name="vol_number" value={data.vol_number}/></div>
				
				<div>
					الصنف: {data.genres && data.genres.map(genre => genre)}
				</div>
				<h3>الفصول</h3>
				<ul>
					{data.chapters &&
						data.chapters.map(chapter => (
							<li>
								<Link to={`/c/${chapter._id}`}>
									{chapter.title}
								</Link>
							</li>
						))}
				</ul>
			</div>
		);
	}
}

class Chapter extends React.Component {
	constructor(props) {
		super(props);
		this.state = { pages: [], currentPage: 1, todosPerPage: 5 };
		this.handleScroll = this.handleScroll.bind(this);
		window.addEventListener("scroll", this.handleScroll);
	}

	handleScroll() {
		if (
			this.refs.iScroll.scrollTop + this.refs.iScroll.clientHeight >=
			this.refs.iScroll.scrollHeight - 20
		) {
			const { currentPage } = this.state;
			this.setState({ currentPage: currentPage + 1 });
		}

		// if (
		// 	window.innerHeight + document.documentElement.scrollTop !==
		// 	document.documentElement.offsetHeight
		// )
		// 	return;
		// const { currentPage } = this.state;
		// this.setState({currentPage: currentPage+1})
	}

	async componentDidMount() {
		const { data } = await axios(
			`https://unmarred-utahceratops.glitch.me/chapter/${this.props.id}`
		);
		const pages = data.pages.sort((a, b) => {
			a = a.split("/").pop();
			b = b.split("/").pop();
			const compare =
				parseInt(a) === NaN ? a.replace(/\D+/g, "") : parseInt(a);
			const to =
				parseInt(b) === NaN ? b.replace(/\D+/g, "") : parseInt(b);
			return compare - to;
		});
		this.setState({ pages });
	}

	async componentDidUpdate(prevProps) {
		if (this.props.id !== prevProps.id) {
			const { data } = await axios(
				`https://unmarred-utahceratops.glitch.me/chapter/${this.props.id}`
			);
			const pages = data.pages.sort((a, b) => {
				a = a.split("/").pop();
				b = b.split("/").pop();
				const compare =
					parseInt(a) === NaN ? a.replace(/\D+/g, "") : parseInt(a);
				const to =
					parseInt(b) === NaN ? b.replace(/\D+/g, "") : parseInt(b);
				return compare - to;
			});
			this.setState({ pages });
		}
	}

	render() {
		const { pages, currentPage, todosPerPage } = this.state;
		const indexOfLastTodo = currentPage * todosPerPage;
		const currentTodos = pages.slice(0, indexOfLastTodo);

		return (
			<div ref="iScroll">
				{pages &&
					currentTodos.map((page, index) => {
						return (
							<div style={{ paddingBottom: "20px" }}>
								{index + 1}
								<img
									style={{ maxWidth: "100%" }}
									src={process.env.PUBLIC_URL + "/" + page}
								/>
								<br />
							</div>
						);
					})}
			</div>
		);
	}
}

class List extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: [],
			loading: true
		};
	}

	async componentDidMount() {
		const { data } = await axios(
			"https://unmarred-utahceratops.glitch.me/manga"
		);
		this.setState({ data, loading: false });
	}

	render() {
		console.log(JSON.parse(localStorage.getItem("history")))
		return (
			<div>
				{this.state.loading ? (
					<div>
						<img
							width="120px"
							src="https://media.giphy.com/media/ucY7FE8F0IysM/giphy.gif"
						/>
						<br />
						Loading...
					</div>
				) : (
					""
				)}
				{localStorage.getItem("history") && <div>
					<h2>آخر 10 مانجا قمت بزيارتها</h2>
					<ul>
					{JSON.parse(localStorage.getItem("history")).map(j=><li><Link style={{display: "flex", alignItems: "", marginBottom: "20px"}} to={j._id}>{j.title}</Link></li>)}
					</ul>
				</div>}
				{this.state.data.length !== 0 ? (
					<div>
						<h2>قائمة المانجا</h2>
						<ol>
							{this.state.data.sort().map(data1 => (
								<li key={data1._id}>
									<Link to={data1._id}>{data1.title}</Link>
								</li>
							))}
						</ol>
					</div>
				) : (
					""
				)}
			</div>
		);
	}
}

class MangaPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = { data: {} };
	}

	async componentDidMount() {
		const { data } = await axios(
			`https://unmarred-utahceratops.glitch.me/manga/${this.props.id}`
		);

		// save value of last
		let arr = localStorage.getItem("history") ? JSON.parse(localStorage.getItem("history")) : [];
		let bol = arr.some(item => item.title === data.title)
		
		if (!bol) arr.unshift(data)
		if(arr.length > 10) arr.length = 10;

		localStorage.setItem('history',JSON.stringify(arr));
		this.setState({ data });
	}

	async componentDidUpdate(prevProps) {
		if (this.props.id !== prevProps.id) {
			const { data } = await axios(
				`https://unmarred-utahceratops.glitch.me/manga/${this.props.id}`
			);
			this.setState({ data });
		}
	}

	render() {
		const { data } = this.state;
		return (
			<div>
				<Helmet>
					<title>{data.title}</title>
				</Helmet>
				<Link to={`/edit/${this.props.id}`}>تعديل</Link>
				<img src={data.img} style={{ maxWidth: "100%" }} />
				<div>
					<h2>{data.title}</h2>
				</div>
				<div>عدد الفصول: {data.ch_number}</div>
				<div>عدد المجلدات: {data.vol_number}</div>
				
				<div>
					الصنف: {data.genres && data.genres.map(genre => genre)}
				</div>
				<h3>الفصول</h3>
				<ul>
					{data.chapters &&
						data.chapters.map(chapter => (
							<li>
								<Link to={`/c/${chapter._id}`}>
									{chapter.title}
								</Link>
							</li>
						))}
				</ul>
			</div>
		);
	}
}

const Main = ({ children }) => (
	<Location>
		{({ location }) => {
			ReactGA.pageview(
				location.pathname + location.search + location.hash
			);
			console.log(location.pathname, location.search, location.hash);
			return children;
		}}
	</Location>
);


const App = () => (
	<Layout>
		<Search />
		<Router>
			<MangaPage path="/:id" />
			<List path="/" />
			<Chapter path="/c/:id" />
			<Edit path="/edit/:id" />
		</Router>
	</Layout>
);

export default App;
