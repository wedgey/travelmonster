$(document).ready(function() {
	function checkPassword(password) {
		if (true) {
			return true;
		} else {
			return false;
		}
	}
	function checkMatchingPasswords(password, cpassword) {
		if (password == cpassword) {
			return true;
		} else {
			return false;
		}
	}

	$("div#signupform form input[name='password'").focusout(function() {
		if ($(this).val().length > 0) {
			if(checkPassword($(this).val()) == false) {
				alert('Error with the password.');
			}
		}
	});

	$("div#signupform form input[name='cpassword'").focusout(function() {
		if($("div#signupform form input[name='password'").val().length > 0 && $(this).val().length > 0) {
			if(checkMatchingPasswords($("div#signupform form input[name='password'").val(),$(this).val()) == false) {
				alert("The passwords don't match.");
			}
		}
	});

	$("div#signupform form").submit(function(event) {
		event.preventDefault();

		//var $url = $(this).attr("action");
		var $url = 'http://23.227.184.143/travelmonster/api/user/register';
		var $firstname = $(this).find("input[name='firstname']").val();
		var $lastname = $(this).find("input[name='lastname']").val();
		var $email = $(this).find("input[name='email']").val();
		var $password = $(this).find("input[name='password']").val();
		var $cpassword = $(this).find("input[name='cpassword']").val();
		var $dateofbirth = $(this).find("input[name='dateofbirth']").val();
		var $country = $(this).find("input[name='country']").val();
		var $city = $(this).find("input[name='city']").val();

		if (checkPassword($password) && checkMatchingPasswords($password,$cpassword)) {
			var credentials = { action: "register", firstname:$firstname, lastname:$lastname, email:$email, password:$password, dateofbirth:$dateofbirth, country:$country, city:$city};
			$.post($url, credentials).done(function(data) {
					console.log(data);
					$("div#signupform").empty().append(data);
				});
		}

	});

	$("div#loginform form").submit(function() {
		event.preventDefault();

		//var $url = $(this).attr("action");
		var $url = 'http://23.227.184.143/travelmonster/api/user/login';
		var $username = $(this).find("input[name='username']").val();
		var $password = $(this).find("input[name='password']").val();

		var credentials = { action: "login", username:$username, password:$password };
		$.post($url, credentials).done(function(data) {
			$("div#loginform").empty().append(data);
		});
	});

	$("div#loginform a#logout").click(function() {
		event.preventDefault();
		var $url = $(this).attr("href");

		$.post($url, {action:'logout'}).done(function(data) {
			$("div#loginform").empty().append(data);
		});
	});
});