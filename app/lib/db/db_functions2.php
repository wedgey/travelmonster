<?php
	function db_connect2() {
		static $connection;

		// Try and connect to the database, if a has not been established yet
		if(!isset($connection)) {
			// Load configuration as an array. Use the actual location of the configuration file
			$config = parse_ini_file(__DIR__.'/../config.ini');
			$connection = new mysqli('localhost', $config['username'], $config['password'], $config['dbname']);
		}

		// If connection was not successful, handle the error
		if($connection === false) {
			// Handle error
			//return mysqli_connect_error();
			return false;
		}

		return $connection;
	}
?>