<?php

function db_connect() {
	// Define connection as a static variable, to avoid connecting more than once
	static $connection;

	// Try and connect to the database, if a has not been established yet
	if(!isset($connection)) {
		// Load configuration as an array. Use the actual location of the configuration file
		$config = parse_ini_file(__DIR__.'/../config.ini');
		$connection = new mysqli('localhost', $config['username'], $config['password'], $config['dbname']);
		//$connection = mysqli_connect('localhost', $config['username'], $config['password'], $config['dbname']);
	}

	// If connection was not successful, handle the error
	if($connection === false) {
		// Handle error
		return mysqli_connect_error();
	}

	return $connection;

}

function db_query($query) {
	// Connect to the database
	$connection = db_connect();

	// Query the database
	$result = mysqli_query($connection, $query);

	return $result;
}

function db_error() {
	$connection = db_connect();
	return mysqli_error($connection);
}

function db_select($query) {
	$rows = array();
	$result = db_query($query);

	// If query failed, return the error
	if($result === false) {
		return false;
	}

	// If query was successful, retrieve all the rows into an array
	while ($row = mysqli_fetch_assoc($result)) {
		$rows[] = $row;
	}

	return $rows;
}

function db_quote($query) {
	$connection = db_connect();
	return mysqli_real_escape_string($connection, $query);
	//return "'" . mysqli_real_escape_string($connection, $query) . "'";
}

function db_get_affected_rows() {
	$connection = db_connect();
	return mysqli_affected_rows($connection);
}

function db_get_last_insert_id() {
	$connection = db_connect();
	return mysqli_insert_id($connection);
}

?>