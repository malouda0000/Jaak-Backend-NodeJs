module.exports = {
	accountDetail: async (payload) => {
		return new Promise((done, reject) => {
			const html = `<!DOCTYPE html>
<html lang="en">

<head>
	<title>Bootstrap Example</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body style="margin:0;">
	<table border="0" cellpadding="0" cellspacing="0"
		style="width:600px;border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif;">
		<tr style="padding:0;">
			<td style="padding:0;">
				<table border="0" cellpadding="0" cellspacing="0"
					style="width:100%; background: #ffffff ;position: relative;font-family: Arial, sans-serif;padding: 0px 0px 00px; ">
					<tr style="padding:0;">
						<td style="padding:0; text-align: center;">
							<p style="color:#39801d; font-size: 25px; font-weight: 800; margin-bottom: 0px;">
							</p>
						</td>
					</tr>
					<tr style="padding:0;">
						<td style="padding:0; text-align: center;">
							<h3 style="color:#000; font-size: 20px; font-weight: 800;">SALESPERSON MAIL </h3>
						</td>
					</tr>

					<tr style="position: relative;">
						<td style="position: relative;z-index: 1;">

							<table border="0" cellpadding="0" cellspacing="0"
								style="width:600px;border-collapse: collapse; font-family: Arial, sans-serif;">
								<tr style="padding:0;">
									<td style="padding:0;" align="center">
										<table border="0" cellpadding="0" cellspacing="0"
											style="width:100%;border-collapse: collapse; font-family: Arial, sans-serif;">

											<tr style="padding:0;">
												<td
													style="padding: 20px 0px 0px 0px;background: #000;border-top-left-radius: 70%;">
													<table border="0" cellpadding="0" cellspacing="0"
														style="background: #f8f8f8;width: 100%;border-collapse: collapse;font-family: Arial, sans-serif;border-top-left-radius: 80%;">
													</table>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
				<table border="0" cellpadding="0" cellspacing="0"
					style="width:100%;position: relative;font-family: Arial, sans-serif;  background-color: #ffffff;padding:20px 0 0;">
					<tr>
						<td>
							<table border="0" cellpadding="0" cellspacing="0"
								style="width:100%;position: relative;font-family: Arial, sans-serif;z-index: 1;">
								<tr>
									<td>
										<table border="0" cellpadding="0" align="center" cellspacing="0"
											style="width:90%;position: relative;font-family: Arial, sans-serif; border-bottom: 1px solid #ddd;">

											<tr>
												<td style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 500;">
														Your Email is</p>
												</td>
												<td align="right" style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 700;">
														${payload.email}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								<tr>
									<td>
										<table border="0" cellpadding="0" align="center" cellspacing="0"
											style="width:90%;position: relative;font-family: Arial, sans-serif; border-bottom: 1px solid #ddd;">

											<tr>
												<td style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 500;">
														Your Password is</p>
												</td>
												<td align="right" style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 700;">
														${payload.password}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								<tr>
									<td>
										<table border="0" cellpadding="0" align="center" cellspacing="0"
											style="width:90%; position: relative;font-family: Arial, sans-serif; padding-bottom: 15px;">

											<tr>
												<td style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 500;">
														Your redirect URL is</p>
												</td>
												<td align="right" style="padding:15px 0;">
													<p
														style="font-family: Arial, sans-serif;margin: 0;font-size: 17px;color: #000;font-weight: 700;">
														${payload.redirectUrl}</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							<table border="0" cellpadding="0" align="center" cellspacing="0"
								style="width:100%;position: relative;font-family: Arial, sans-serif; background: #f1f1f1; padding: 18px 0">
								<tr>
									<td align="center" style="text-align: center">
										© Copyright 2021 Blockcart, All rights reserved


									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>

			</td>
		</tr>
	</table>
</body>

</html>`;
			return done(html);
		});
	},
};